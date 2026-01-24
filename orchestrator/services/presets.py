"""System council presets - predefined balanced council configurations.

These presets provide opinionated, balanced starting points for common use cases.
All presets include at least one adversarial role (critic or devil's advocate).
"""

from typing import List, Optional, TypedDict


class PresetMember(TypedDict):
    """A member in a system preset."""
    model_key: str
    display_name: str
    role: str  # thinker, critic, devils_advocate, chair
    weight: float


class SystemPreset(TypedDict):
    """A system council preset."""
    id: str
    name: str
    description: str
    icon: str
    members: list[PresetMember]
    is_system: bool
    is_balanced: bool


SYSTEM_PRESETS: dict[str, SystemPreset] = {
    "fast": {
        "id": "system:fast",
        "name": "Fast Brainstorm",
        "description": "Quick ideation with efficient models. Low cost, fast turnaround.",
        "icon": "zap",
        "members": [
            {
                "model_key": "google/gemini-2.0-flash-001",
                "display_name": "Gemini 2.0 Flash",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "openai/gpt-4.1-nano",
                "display_name": "GPT-4.1 Nano",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "x-ai/grok-4-fast",
                "display_name": "Grok 4 Fast",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "openai/gpt-4.1-mini",
                "display_name": "GPT-4.1 Mini",
                "role": "critic",
                "weight": 1.0,
            },
        ],
        "is_system": True,
        "is_balanced": True,
    },
    "balanced": {
        "id": "system:balanced",
        "name": "Decision Brief",
        "description": "Executive recommendations with balanced cost and quality.",
        "icon": "briefcase",
        "members": [
            {
                "model_key": "anthropic/claude-sonnet-4",
                "display_name": "Claude Sonnet 4",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "openai/gpt-5",
                "display_name": "GPT-5",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "anthropic/claude-haiku-4.5",
                "display_name": "Claude Haiku 4.5",
                "role": "critic",
                "weight": 1.0,
            },
            {
                "model_key": "anthropic/claude-sonnet-4.5",
                "display_name": "Claude Sonnet 4.5",
                "role": "chair",
                "weight": 1.0,
            },
        ],
        "is_system": True,
        "is_balanced": True,
    },
    "deep_analysis": {
        "id": "system:deep_analysis",
        "name": "Deep Analysis",
        "description": "Maximum rigor with premium models. Higher cost, thorough analysis.",
        "icon": "microscope",
        "members": [
            {
                "model_key": "anthropic/claude-opus-4.5",
                "display_name": "Claude Opus 4.5",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "openai/gpt-5.2",
                "display_name": "GPT-5.2",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "google/gemini-2.5-pro",
                "display_name": "Gemini 2.5 Pro",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "x-ai/grok-3",
                "display_name": "Grok 3",
                "role": "devils_advocate",
                "weight": 1.0,
            },
            {
                "model_key": "anthropic/claude-opus-4.5",
                "display_name": "Claude Opus 4.5 (Chair)",
                "role": "chair",
                "weight": 1.0,
            },
        ],
        "is_system": True,
        "is_balanced": True,
    },
    "red_team": {
        "id": "system:red_team",
        "name": "Red Team",
        "description": "Critique-first approach. Challenge assumptions and find weaknesses.",
        "icon": "shield-alert",
        "members": [
            {
                "model_key": "anthropic/claude-sonnet-4.5",
                "display_name": "Claude Sonnet 4.5",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "openai/gpt-4.1",
                "display_name": "GPT-4.1",
                "role": "critic",
                "weight": 1.0,
            },
            {
                "model_key": "x-ai/grok-3",
                "display_name": "Grok 3",
                "role": "critic",
                "weight": 1.0,
            },
            {
                "model_key": "anthropic/claude-opus-4.5",
                "display_name": "Claude Opus 4.5 (Chair)",
                "role": "chair",
                "weight": 1.0,
            },
        ],
        "is_system": True,
        "is_balanced": True,
    },
    "code_review": {
        "id": "system:code_review",
        "name": "Code Review",
        "description": "Technical analysis for architecture and code review.",
        "icon": "code",
        "members": [
            {
                "model_key": "anthropic/claude-sonnet-4.5",
                "display_name": "Claude Sonnet 4.5",
                "role": "thinker",
                "weight": 1.0,
            },
            {
                "model_key": "deepseek/deepseek-v3.2",
                "display_name": "DeepSeek v3.2",
                "role": "critic",
                "weight": 1.0,
            },
            {
                "model_key": "openai/gpt-4.1",
                "display_name": "GPT-4.1",
                "role": "critic",
                "weight": 1.0,
            },
            {
                "model_key": "anthropic/claude-opus-4.5",
                "display_name": "Claude Opus 4.5 (Chair)",
                "role": "chair",
                "weight": 1.0,
            },
        ],
        "is_system": True,
        "is_balanced": True,
    },
}


def get_system_preset(preset_id: str) -> Optional[SystemPreset]:
    """Get a system preset by ID.

    Args:
        preset_id: Preset ID (e.g., "system:fast" or just "fast").

    Returns:
        The preset or None if not found.
    """
    # Strip "system:" prefix if present
    key = preset_id.replace("system:", "")
    return SYSTEM_PRESETS.get(key)


def list_system_presets() -> List[SystemPreset]:
    """Get all system presets.

    Returns:
        List of all system presets.
    """
    return list(SYSTEM_PRESETS.values())


def is_system_preset(preset_id: str) -> bool:
    """Check if a preset ID is a system preset.

    Args:
        preset_id: Preset ID to check.

    Returns:
        True if it's a system preset.
    """
    return preset_id.startswith("system:") or preset_id in SYSTEM_PRESETS
