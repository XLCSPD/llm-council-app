"""Council balancing service for ensuring adversarial roles in councils.

This module provides validation and auto-balancing logic to ensure every
council run includes at least one adversarial role (critic or devil's advocate).
"""

from dataclasses import dataclass
from typing import Optional

from models.schemas import CouncilMemberConfig, ModelRole


# Roles that count as adversarial (provide critical perspective)
ADVERSARIAL_ROLES = {ModelRole.CRITIC, ModelRole.DEVILS_ADVOCATE}

# Default model to inject when no suitable model can be reassigned
DEFAULT_CRITIC_MODEL = "google/gemini-2.0-flash-001"
DEFAULT_CRITIC_DISPLAY_NAME = "Gemini 2.0 Flash (Auto-Critic)"


@dataclass
class BalanceChange:
    """Record of a change made during council balancing."""
    type: str  # "auto_assigned_critic" | "injected_critic"
    model_key: str
    original_role: Optional[str]
    new_role: str
    reason: str

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "model_key": self.model_key,
            "original_role": self.original_role,
            "new_role": self.new_role,
            "reason": self.reason,
        }


@dataclass
class SuggestedFix:
    """Suggested fix when auto-balance is disabled."""
    type: str  # "assign_role" | "inject_model"
    model_key: str
    recommended_role: str

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "model_key": self.model_key,
            "recommended_role": self.recommended_role,
        }


def validate_council(
    members: list[CouncilMemberConfig],
) -> tuple[bool, list[str]]:
    """Validate council configuration.

    Checks:
    - At least 2 members
    - At most 1 chair

    Note: Adversarial role check is separate (handled by balance logic).

    Args:
        members: List of council member configurations.

    Returns:
        Tuple of (is_valid, list_of_errors).
    """
    errors: list[str] = []

    # Check minimum members
    if len(members) < 2:
        errors.append("Council must have at least 2 members")

    # Check maximum chairs
    chair_count = sum(1 for m in members if m.role == ModelRole.CHAIR)
    if chair_count > 1:
        errors.append("Council can have at most 1 chair")

    return len(errors) == 0, errors


def has_adversarial_role(members: list[CouncilMemberConfig]) -> bool:
    """Check if council has at least one adversarial role.

    Args:
        members: List of council member configurations.

    Returns:
        True if at least one member has critic or devils_advocate role.
    """
    return any(m.role in ADVERSARIAL_ROLES for m in members)


def find_cheapest_non_chair(
    members: list[CouncilMemberConfig],
    model_costs: dict[str, dict[str, float]],
) -> Optional[CouncilMemberConfig]:
    """Find the cheapest non-chair model in the council.

    Args:
        members: List of council member configurations.
        model_costs: Dictionary mapping model_key to {"input": cost, "output": cost}.

    Returns:
        The cheapest non-chair member, or None if all are chairs.
    """
    non_chairs = [m for m in members if m.role != ModelRole.CHAIR]
    if not non_chairs:
        return None

    def get_cost(member: CouncilMemberConfig) -> float:
        costs = model_costs.get(member.model_key, {"input": 0.001, "output": 0.002})
        # Use output cost as primary sorting criteria (usually more expensive)
        return costs.get("output", 0.002)

    return min(non_chairs, key=get_cost)


def balance_council(
    members: list[CouncilMemberConfig],
    model_costs: dict[str, dict[str, float]],
) -> tuple[list[CouncilMemberConfig], list[BalanceChange]]:
    """Balance council by ensuring at least one adversarial role.

    Auto-balance policy:
    1. If no adversarial role exists, find cheapest non-chair model
    2. Reassign it to 'critic' role
    3. If no suitable model (all are chairs), inject DEFAULT_CRITIC_MODEL
    4. Track all changes for auditability

    Args:
        members: List of council member configurations.
        model_costs: Dictionary mapping model_key to {"input": cost, "output": cost}.

    Returns:
        Tuple of (balanced_members, list_of_changes).
    """
    changes: list[BalanceChange] = []

    # Check if already balanced
    if has_adversarial_role(members):
        return members, changes

    # Need to add adversarial role
    balanced_members = [
        CouncilMemberConfig(
            model_key=m.model_key,
            display_name=m.display_name,
            role=m.role,
            weight=m.weight,
            token_limit=m.token_limit,
        )
        for m in members
    ]

    # Strategy 1: Reassign cheapest non-chair to critic
    cheapest = find_cheapest_non_chair(members, model_costs)
    if cheapest:
        # Find and update the member in our copy
        for i, m in enumerate(balanced_members):
            if m.model_key == cheapest.model_key and m.role == cheapest.role:
                original_role = m.role.value
                balanced_members[i] = CouncilMemberConfig(
                    model_key=m.model_key,
                    display_name=m.display_name,
                    role=ModelRole.CRITIC,
                    weight=m.weight,
                    token_limit=m.token_limit,
                )
                changes.append(BalanceChange(
                    type="auto_assigned_critic",
                    model_key=m.model_key,
                    original_role=original_role,
                    new_role="critic",
                    reason=f"No adversarial role present; assigned cheapest model as critic",
                ))
                break
    else:
        # Strategy 2: Inject default critic model
        balanced_members.append(CouncilMemberConfig(
            model_key=DEFAULT_CRITIC_MODEL,
            display_name=DEFAULT_CRITIC_DISPLAY_NAME,
            role=ModelRole.CRITIC,
            weight=1.0,
            token_limit=None,
        ))
        changes.append(BalanceChange(
            type="injected_critic",
            model_key=DEFAULT_CRITIC_MODEL,
            original_role=None,
            new_role="critic",
            reason="No suitable model to reassign; injected default critic model",
        ))

    return balanced_members, changes


def get_suggested_fix(
    members: list[CouncilMemberConfig],
    model_costs: dict[str, dict[str, float]],
) -> SuggestedFix:
    """Get suggested fix for unbalanced council when auto-balance is disabled.

    Args:
        members: List of council member configurations.
        model_costs: Dictionary mapping model_key to {"input": cost, "output": cost}.

    Returns:
        Suggested fix to balance the council.
    """
    # Prefer reassigning an existing model
    cheapest = find_cheapest_non_chair(members, model_costs)
    if cheapest:
        return SuggestedFix(
            type="assign_role",
            model_key=cheapest.model_key,
            recommended_role="critic",
        )

    # Fallback to suggesting model injection
    return SuggestedFix(
        type="inject_model",
        model_key=DEFAULT_CRITIC_MODEL,
        recommended_role="critic",
    )
