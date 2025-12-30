"""Database layer using Supabase."""

from .supabase import get_supabase_client, SupabaseClient

__all__ = ["get_supabase_client", "SupabaseClient"]
