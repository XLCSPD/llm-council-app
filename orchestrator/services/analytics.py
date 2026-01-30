"""Analytics service for admin dashboard metrics."""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from db.supabase import get_supabase_client


class AnalyticsError(Exception):
    """Analytics-related errors."""
    pass


def _get_time_delta(time_range: str) -> timedelta:
    """Convert time range string to timedelta."""
    ranges = {
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90),
        "1y": timedelta(days=365),
    }
    return ranges.get(time_range, timedelta(days=30))


def _get_start_date(time_range: str) -> str:
    """Get ISO format start date for time range."""
    delta = _get_time_delta(time_range)
    start = datetime.utcnow() - delta
    return start.isoformat()


async def check_platform_admin(user_id: UUID) -> bool:
    """Check if user is a platform administrator.

    Args:
        user_id: User ID to check

    Returns:
        True if user is a platform admin
    """
    client = get_supabase_client()._client

    result = (
        client.table("platform_admins")
        .select("id")
        .eq("user_id", str(user_id))
        .execute()
    )

    return len(result.data) > 0


async def verify_analytics_access(org_id: Optional[UUID], user_id: UUID) -> bool:
    """Verify user has access to requested analytics scope.

    Args:
        org_id: Organization ID (None for platform-wide)
        user_id: User requesting access

    Returns:
        True if access is allowed
    """
    client = get_supabase_client()._client

    if org_id is None:
        # Platform-wide access requires platform admin
        return await check_platform_admin(user_id)
    else:
        # Org-scoped access requires org admin/owner
        result = (
            client.table("org_members")
            .select("role")
            .eq("org_id", str(org_id))
            .eq("user_id", str(user_id))
            .execute()
        )

        if not result.data:
            return False

        role = result.data[0].get("role")
        return role in ("owner", "admin")


async def get_analytics_summary(
    org_id: Optional[UUID] = None,
    time_range: str = "30d"
) -> dict:
    """Get summary metrics for dashboard header cards.

    Args:
        org_id: Organization ID (None for platform-wide)
        time_range: Time range (7d, 30d, 90d, 1y)

    Returns:
        Summary metrics dict
    """
    client = get_supabase_client()._client
    start_date = _get_start_date(time_range)

    # Build base query for sessions
    if org_id:
        # Get project IDs for this org
        projects = (
            client.table("projects")
            .select("id")
            .eq("org_id", str(org_id))
            .execute()
        )
        project_ids = [p["id"] for p in projects.data]

        if not project_ids:
            return {
                "active_users": 0,
                "total_sessions": 0,
                "total_runs": 0,
                "successful_runs": 0,
                "success_rate": 0,
                "total_cost": 0,
            }

        # Get sessions for these projects
        sessions = (
            client.table("sessions")
            .select("id, created_by")
            .in_("project_id", project_ids)
            .gte("created_at", start_date)
            .execute()
        )
    else:
        # Platform-wide - all sessions
        sessions = (
            client.table("sessions")
            .select("id, created_by")
            .gte("created_at", start_date)
            .execute()
        )

    session_ids = [s["id"] for s in sessions.data]
    active_users = len(set(s["created_by"] for s in sessions.data if s["created_by"]))
    total_sessions = len(sessions.data)

    # Get runs for these sessions
    if session_ids:
        runs = (
            client.table("runs")
            .select("id, status")
            .in_("session_id", session_ids)
            .gte("created_at", start_date)
            .execute()
        )

        total_runs = len(runs.data)
        successful_runs = len([r for r in runs.data if r["status"] == "succeeded"])
        success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0

        # Get actual costs from run_models (runs.cost_usd is not populated)
        run_ids = [r["id"] for r in runs.data]
        if run_ids:
            run_models = (
                client.table("run_models")
                .select("cost_usd")
                .in_("run_id", run_ids)
                .execute()
            )
            total_cost = sum(rm.get("cost_usd") or 0 for rm in run_models.data)
        else:
            total_cost = 0
    else:
        total_runs = 0
        successful_runs = 0
        total_cost = 0
        success_rate = 0

    return {
        "active_users": active_users,
        "total_sessions": total_sessions,
        "total_runs": total_runs,
        "successful_runs": successful_runs,
        "success_rate": round(success_rate, 1),
        "total_cost": round(total_cost, 2),
    }


async def get_usage_analytics(
    org_id: Optional[UUID] = None,
    time_range: str = "30d"
) -> dict:
    """Get usage analytics with time series data.

    Args:
        org_id: Organization ID (None for platform-wide)
        time_range: Time range (7d, 30d, 90d, 1y)

    Returns:
        Usage metrics with daily breakdown
    """
    client = get_supabase_client()._client
    start_date = _get_start_date(time_range)

    # Get project IDs for org scope
    project_ids = None
    if org_id:
        projects = (
            client.table("projects")
            .select("id")
            .eq("org_id", str(org_id))
            .execute()
        )
        project_ids = [p["id"] for p in projects.data]

        if not project_ids:
            return {"daily_data": [], "top_users": []}

    # Get sessions with dates
    if project_ids:
        sessions = (
            client.table("sessions")
            .select("id, created_by, created_at")
            .in_("project_id", project_ids)
            .gte("created_at", start_date)
            .order("created_at")
            .execute()
        )
    else:
        sessions = (
            client.table("sessions")
            .select("id, created_by, created_at")
            .gte("created_at", start_date)
            .order("created_at")
            .execute()
        )

    session_ids = [s["id"] for s in sessions.data]

    # Get runs
    runs_data = []
    if session_ids:
        runs = (
            client.table("runs")
            .select("id, session_id, status, created_at")
            .in_("session_id", session_ids)
            .gte("created_at", start_date)
            .order("created_at")
            .execute()
        )
        runs_data = runs.data

    # Aggregate by day
    daily_sessions = {}
    daily_runs = {}
    user_counts = {}

    for session in sessions.data:
        date = session["created_at"][:10]  # YYYY-MM-DD
        daily_sessions[date] = daily_sessions.get(date, 0) + 1

        user_id = session["created_by"]
        if user_id:
            user_counts[user_id] = user_counts.get(user_id, 0) + 1

    for run in runs_data:
        date = run["created_at"][:10]
        daily_runs[date] = daily_runs.get(date, 0) + 1

    # Build daily data array
    all_dates = sorted(set(list(daily_sessions.keys()) + list(daily_runs.keys())))
    daily_data = [
        {
            "date": date,
            "sessions": daily_sessions.get(date, 0),
            "runs": daily_runs.get(date, 0),
        }
        for date in all_dates
    ]

    # Top users (get user emails)
    top_user_ids = sorted(user_counts.items(), key=lambda x: -x[1])[:10]
    top_users = []

    for user_id, count in top_user_ids:
        # Get user email from auth admin API
        email = None
        try:
            user_response = client.auth.admin.get_user_by_id(user_id)
            if user_response and user_response.user:
                email = user_response.user.email
        except Exception:
            pass

        top_users.append({
            "user_id": user_id,
            "email": email,
            "session_count": count,
        })

    return {
        "daily_data": daily_data,
        "top_users": top_users,
        "total_sessions": len(sessions.data),
        "total_runs": len(runs_data),
    }


async def get_cost_analytics(
    org_id: Optional[UUID] = None,
    time_range: str = "30d",
    group_by: str = "model"  # model, user, day
) -> dict:
    """Get cost breakdown analytics.

    Args:
        org_id: Organization ID (None for platform-wide)
        time_range: Time range (7d, 30d, 90d, 1y)
        group_by: Grouping dimension (model, user, day)

    Returns:
        Cost breakdown data
    """
    client = get_supabase_client()._client
    start_date = _get_start_date(time_range)

    # Get project IDs for org scope
    project_ids = None
    if org_id:
        projects = (
            client.table("projects")
            .select("id")
            .eq("org_id", str(org_id))
            .execute()
        )
        project_ids = [p["id"] for p in projects.data]

        if not project_ids:
            return {"by_model": [], "by_user": [], "by_day": [], "total": 0}

    # Get sessions
    if project_ids:
        sessions = (
            client.table("sessions")
            .select("id, created_by")
            .in_("project_id", project_ids)
            .gte("created_at", start_date)
            .execute()
        )
    else:
        sessions = (
            client.table("sessions")
            .select("id, created_by")
            .gte("created_at", start_date)
            .execute()
        )

    session_ids = [s["id"] for s in sessions.data]
    session_user_map = {s["id"]: s["created_by"] for s in sessions.data}

    if not session_ids:
        return {"by_model": [], "by_user": [], "by_day": [], "total": 0}

    # Get runs (costs come from run_models, not runs table)
    runs = (
        client.table("runs")
        .select("id, session_id, created_at")
        .in_("session_id", session_ids)
        .gte("created_at", start_date)
        .execute()
    )

    run_ids = [r["id"] for r in runs.data]

    # Get run_models for model breakdown
    run_models = []
    if run_ids:
        rm_result = (
            client.table("run_models")
            .select("run_id, model_key, display_name, cost_usd")
            .in_("run_id", run_ids)
            .execute()
        )
        run_models = rm_result.data

    # Aggregate by model
    model_costs = {}
    for rm in run_models:
        key = rm["model_key"]
        name = rm.get("display_name") or key
        cost = rm.get("cost_usd") or 0

        if key not in model_costs:
            model_costs[key] = {"model_key": key, "display_name": name, "cost": 0, "count": 0}
        model_costs[key]["cost"] += cost
        model_costs[key]["count"] += 1

    by_model = sorted(model_costs.values(), key=lambda x: -x["cost"])

    # Calculate total from run_models (runs.cost_usd is not populated)
    total = sum(rm.get("cost_usd") or 0 for rm in run_models)

    # Build run cost map from run_models for user/day aggregation
    run_cost_map = {}
    for rm in run_models:
        run_id = rm["run_id"]
        cost = rm.get("cost_usd") or 0
        run_cost_map[run_id] = run_cost_map.get(run_id, 0) + cost

    # Aggregate by user
    user_costs = {}
    for run in runs.data:
        user_id = session_user_map.get(run["session_id"])
        cost = run_cost_map.get(run["id"], 0)

        if user_id:
            if user_id not in user_costs:
                user_costs[user_id] = {"user_id": user_id, "cost": 0, "run_count": 0}
            user_costs[user_id]["cost"] += cost
            user_costs[user_id]["run_count"] += 1

    # Sort and get top 10, then add emails
    sorted_users = sorted(user_costs.values(), key=lambda x: -x["cost"])[:10]
    by_user = []
    for user_data in sorted_users:
        email = None
        try:
            user_response = client.auth.admin.get_user_by_id(user_data["user_id"])
            if user_response and user_response.user:
                email = user_response.user.email
        except Exception:
            pass
        by_user.append({
            "user_id": user_data["user_id"],
            "email": email,
            "cost": user_data["cost"],
            "run_count": user_data["run_count"],
        })

    # Aggregate by day
    daily_costs = {}
    for run in runs.data:
        date = run["created_at"][:10]
        cost = run_cost_map.get(run["id"], 0)
        daily_costs[date] = daily_costs.get(date, 0) + cost

    by_day = [{"date": d, "cost": round(c, 4)} for d, c in sorted(daily_costs.items())]

    return {
        "by_model": by_model,
        "by_user": by_user,
        "by_day": by_day,
        "total": round(total, 2),
    }


async def get_model_analytics(
    org_id: Optional[UUID] = None,
    time_range: str = "30d"
) -> dict:
    """Get model performance analytics.

    Args:
        org_id: Organization ID (None for platform-wide)
        time_range: Time range (7d, 30d, 90d, 1y)

    Returns:
        Model performance metrics
    """
    client = get_supabase_client()._client
    start_date = _get_start_date(time_range)

    # Get project IDs for org scope
    project_ids = None
    if org_id:
        projects = (
            client.table("projects")
            .select("id")
            .eq("org_id", str(org_id))
            .execute()
        )
        project_ids = [p["id"] for p in projects.data]

        if not project_ids:
            return {"models": [], "role_distribution": []}

    # Get sessions
    if project_ids:
        sessions = (
            client.table("sessions")
            .select("id")
            .in_("project_id", project_ids)
            .gte("created_at", start_date)
            .execute()
        )
    else:
        sessions = (
            client.table("sessions")
            .select("id")
            .gte("created_at", start_date)
            .execute()
        )

    session_ids = [s["id"] for s in sessions.data]

    if not session_ids:
        return {"models": [], "role_distribution": []}

    # Get runs
    runs = (
        client.table("runs")
        .select("id")
        .in_("session_id", session_ids)
        .gte("created_at", start_date)
        .execute()
    )

    run_ids = [r["id"] for r in runs.data]

    if not run_ids:
        return {"models": [], "role_distribution": []}

    # Get run_models with performance data
    run_models = (
        client.table("run_models")
        .select("id, run_id, model_key, display_name, role, status, latency_ms, cost_usd")
        .in_("run_id", run_ids)
        .execute()
    )

    # Aggregate by model
    model_stats = {}
    role_counts = {}

    for rm in run_models.data:
        key = rm["model_key"]
        name = rm.get("display_name") or key

        if key not in model_stats:
            model_stats[key] = {
                "model_key": key,
                "display_name": name,
                "total_runs": 0,
                "successful_runs": 0,
                "total_latency": 0,
                "latency_count": 0,
                "total_cost": 0,
            }

        model_stats[key]["total_runs"] += 1
        if rm["status"] == "succeeded":
            model_stats[key]["successful_runs"] += 1
        if rm.get("latency_ms"):
            model_stats[key]["total_latency"] += rm["latency_ms"]
            model_stats[key]["latency_count"] += 1
        if rm.get("cost_usd"):
            model_stats[key]["total_cost"] += rm["cost_usd"]

        # Role distribution
        role = rm.get("role") or "unknown"
        role_counts[role] = role_counts.get(role, 0) + 1

    # Calculate averages and format
    models = []
    for key, stats in model_stats.items():
        success_rate = (
            stats["successful_runs"] / stats["total_runs"] * 100
            if stats["total_runs"] > 0 else 0
        )
        avg_latency = (
            stats["total_latency"] / stats["latency_count"]
            if stats["latency_count"] > 0 else 0
        )

        models.append({
            "model_key": key,
            "display_name": stats["display_name"],
            "usage_count": stats["total_runs"],
            "success_rate": round(success_rate, 1),
            "avg_latency_ms": round(avg_latency),
            "total_cost": round(stats["total_cost"], 4),
        })

    # Sort by usage
    models = sorted(models, key=lambda x: -x["usage_count"])

    # Role distribution
    role_distribution = [
        {"role": role, "count": count}
        for role, count in sorted(role_counts.items(), key=lambda x: -x[1])
    ]

    return {
        "models": models,
        "role_distribution": role_distribution,
    }
