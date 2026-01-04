"""Models API endpoints for available LLM models."""

from fastapi import APIRouter

from app.models.domain.council import RoleType
from app.models.schemas.responses import ModelInfo

router = APIRouter()

# Available models catalog - Updated with correct OpenRouter model IDs (Jan 2026)
AVAILABLE_MODELS: list[ModelInfo] = [
    # OpenAI Models
    ModelInfo(
        id="openai/gpt-4o-mini",
        provider="openai",
        display_name="GPT-4o Mini",
        context_window=128000,
        cost_per_1k_input=0.00015,
        cost_per_1k_output=0.0006,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="fast",
    ),
    ModelInfo(
        id="openai/gpt-4.1",
        provider="openai",
        display_name="GPT-4.1",
        context_window=1047576,
        cost_per_1k_input=0.002,
        cost_per_1k_output=0.008,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="balanced",
    ),
    ModelInfo(
        id="openai/gpt-4.1-mini",
        provider="openai",
        display_name="GPT-4.1 Mini",
        context_window=1047576,
        cost_per_1k_input=0.0004,
        cost_per_1k_output=0.0016,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="fast",
    ),
    ModelInfo(
        id="openai/gpt-5-mini",
        provider="openai",
        display_name="GPT-5 Mini",
        context_window=400000,
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.002,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.SYNTHESIZER],
        tier="fast",
    ),
    ModelInfo(
        id="openai/gpt-5.2",
        provider="openai",
        display_name="GPT-5.2",
        context_window=400000,
        cost_per_1k_input=0.00175,
        cost_per_1k_output=0.014,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="balanced",
    ),
    ModelInfo(
        id="openai/gpt-5.2-chat",
        provider="openai",
        display_name="GPT-5.2 Chat",
        context_window=128000,
        cost_per_1k_input=0.00175,
        cost_per_1k_output=0.014,
        supports_streaming=True,
        recommended_roles=[RoleType.CRITIC],
        tier="deep",
    ),
    ModelInfo(
        id="openai/gpt-5.2-pro",
        provider="openai",
        display_name="GPT-5.2 Pro",
        context_window=400000,
        cost_per_1k_input=0.021,
        cost_per_1k_output=0.168,
        supports_streaming=True,
        recommended_roles=[RoleType.SYNTHESIZER],
        tier="executive",
    ),
    ModelInfo(
        id="openai/gpt-5",
        provider="openai",
        display_name="GPT-5",
        context_window=400000,
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.010,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="balanced",
    ),
    ModelInfo(
        id="openai/gpt-5.1",
        provider="openai",
        display_name="GPT-5.1",
        context_window=400000,
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.010,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="balanced",
    ),
    ModelInfo(
        id="openai/gpt-5.1-codex-max",
        provider="openai",
        display_name="GPT-5.1 Codex Max",
        context_window=400000,
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.010,
        supports_streaming=True,
        recommended_roles=[RoleType.SYNTHESIZER],
        tier="code",
    ),
    ModelInfo(
        id="openai/gpt-5-nano",
        provider="openai",
        display_name="GPT-5 Nano",
        context_window=400000,
        cost_per_1k_input=0.00005,
        cost_per_1k_output=0.0004,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.DEVILS_ADVOCATE],
        tier="fast",
    ),
    ModelInfo(
        id="openai/gpt-4.1-nano",
        provider="openai",
        display_name="GPT-4.1 Nano",
        context_window=1047576,
        cost_per_1k_input=0.0001,
        cost_per_1k_output=0.0004,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="fast",
    ),
    # Anthropic Models
    ModelInfo(
        id="anthropic/claude-opus-4.5",
        provider="anthropic",
        display_name="Claude Opus 4.5",
        context_window=200000,
        cost_per_1k_input=0.005,
        cost_per_1k_output=0.025,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="executive",
    ),
    ModelInfo(
        id="anthropic/claude-sonnet-4.5",
        provider="anthropic",
        display_name="Claude Sonnet 4.5",
        context_window=1000000,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="deep",
    ),
    ModelInfo(
        id="anthropic/claude-sonnet-4",
        provider="anthropic",
        display_name="Claude Sonnet 4",
        context_window=1000000,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="deep",
    ),
    ModelInfo(
        id="anthropic/claude-haiku-4.5",
        provider="anthropic",
        display_name="Claude Haiku 4.5",
        context_window=200000,
        cost_per_1k_input=0.001,
        cost_per_1k_output=0.005,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="critic",
    ),
    ModelInfo(
        id="anthropic/claude-3.5-sonnet",
        provider="anthropic",
        display_name="Claude 3.5 Sonnet",
        context_window=200000,
        cost_per_1k_input=0.006,
        cost_per_1k_output=0.030,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="deep",
    ),
    ModelInfo(
        id="anthropic/claude-3.5-haiku",
        provider="anthropic",
        display_name="Claude 3.5 Haiku",
        context_window=200000,
        cost_per_1k_input=0.0008,
        cost_per_1k_output=0.004,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="critic",
    ),
    ModelInfo(
        id="anthropic/claude-3.7-sonnet",
        provider="anthropic",
        display_name="Claude 3.7 Sonnet",
        context_window=200000,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="deep",
    ),
    # Google Models
    ModelInfo(
        id="google/gemini-2.5-flash",
        provider="google",
        display_name="Gemini 2.5 Flash",
        context_window=1048576,
        cost_per_1k_input=0.0003,
        cost_per_1k_output=0.0025,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.DEVILS_ADVOCATE],
        tier="balanced",
    ),
    ModelInfo(
        id="google/gemini-2.0-flash-001",
        provider="google",
        display_name="Gemini 2.0 Flash",
        context_window=1048576,
        cost_per_1k_input=0.0001,
        cost_per_1k_output=0.0004,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.DEVILS_ADVOCATE],
        tier="fast",
    ),
    ModelInfo(
        id="google/gemini-2.5-pro",
        provider="google",
        display_name="Gemini 2.5 Pro",
        context_window=1048576,
        cost_per_1k_input=0.00125,
        cost_per_1k_output=0.010,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC, RoleType.SYNTHESIZER],
        tier="balanced",
    ),
    ModelInfo(
        id="google/gemini-3-pro-preview",
        provider="google",
        display_name="Gemini 3 Pro",
        context_window=1048576,
        cost_per_1k_input=0.002,
        cost_per_1k_output=0.012,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="balanced",
    ),
    # xAI Grok Models
    ModelInfo(
        id="x-ai/grok-3-mini",
        provider="xai",
        display_name="Grok 3 Mini",
        context_window=131072,
        cost_per_1k_input=0.0003,
        cost_per_1k_output=0.0005,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.DEVILS_ADVOCATE],
        tier="fast",
    ),
    ModelInfo(
        id="x-ai/grok-4-fast",
        provider="xai",
        display_name="Grok 4 Fast",
        context_window=2000000,
        cost_per_1k_input=0.0002,
        cost_per_1k_output=0.0005,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="fast",
    ),
    ModelInfo(
        id="x-ai/grok-4.1-fast",
        provider="xai",
        display_name="Grok 4.1 Fast",
        context_window=2000000,
        cost_per_1k_input=0.0002,
        cost_per_1k_output=0.0005,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.DEVILS_ADVOCATE],
        tier="fast",
    ),
    ModelInfo(
        id="x-ai/grok-code-fast-1",
        provider="xai",
        display_name="Grok Code Fast 1",
        context_window=256000,
        cost_per_1k_input=0.0002,
        cost_per_1k_output=0.0015,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="code",
    ),
    ModelInfo(
        id="x-ai/grok-3",
        provider="xai",
        display_name="Grok 3",
        context_window=131072,
        cost_per_1k_input=0.003,
        cost_per_1k_output=0.015,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.SYNTHESIZER],
        tier="deep",
    ),
    # Meta Models
    ModelInfo(
        id="meta-llama/llama-3.3-70b-instruct",
        provider="meta",
        display_name="Llama 3.3 70B",
        context_window=128000,
        cost_per_1k_input=0.00035,
        cost_per_1k_output=0.0004,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.DEVILS_ADVOCATE],
        tier="fast",
    ),
    # Mistral Models
    ModelInfo(
        id="mistralai/mistral-large-2411",
        provider="mistral",
        display_name="Mistral Large",
        context_window=128000,
        cost_per_1k_input=0.002,
        cost_per_1k_output=0.006,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="balanced",
    ),
    # DeepSeek Models
    ModelInfo(
        id="deepseek/deepseek-v3.2",
        provider="deepseek",
        display_name="DeepSeek V3.2",
        context_window=163840,
        cost_per_1k_input=0.00025,
        cost_per_1k_output=0.00038,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="balanced",
    ),
    ModelInfo(
        id="deepseek/deepseek-v3.2-exp",
        provider="deepseek",
        display_name="DeepSeek V3.2 Exp",
        context_window=163840,
        cost_per_1k_input=0.00021,
        cost_per_1k_output=0.00032,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER],
        tier="fast",
    ),
    ModelInfo(
        id="deepseek/deepseek-chat-v3.1",
        provider="deepseek",
        display_name="DeepSeek V3.1",
        context_window=32768,
        cost_per_1k_input=0.00015,
        cost_per_1k_output=0.00075,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER, RoleType.CRITIC],
        tier="fast",
    ),
    ModelInfo(
        id="deepseek/deepseek-v3.1-terminus",
        provider="deepseek",
        display_name="DeepSeek V3.1 Terminus",
        context_window=163840,
        cost_per_1k_input=0.00021,
        cost_per_1k_output=0.00079,
        supports_streaming=True,
        recommended_roles=[RoleType.CRITIC],
        tier="critic",
    ),
]


@router.get("", response_model=list[ModelInfo])
async def list_models() -> list[ModelInfo]:
    """List all available LLM models."""
    return AVAILABLE_MODELS


@router.get("/{model_id:path}", response_model=ModelInfo)
async def get_model(model_id: str) -> ModelInfo:
    """Get a specific model by ID."""
    for model in AVAILABLE_MODELS:
        if model.id == model_id:
            return model
    # Return a generic entry if not found
    return ModelInfo(
        id=model_id,
        provider=model_id.split("/")[0] if "/" in model_id else "unknown",
        display_name=model_id.split("/")[-1] if "/" in model_id else model_id,
        context_window=128000,
        cost_per_1k_input=0.001,
        cost_per_1k_output=0.002,
        supports_streaming=True,
        recommended_roles=[RoleType.THINKER],
    )


@router.get("/by-role/{role}", response_model=list[ModelInfo])
async def get_models_by_role(role: RoleType) -> list[ModelInfo]:
    """Get models recommended for a specific role."""
    return [m for m in AVAILABLE_MODELS if role in m.recommended_roles]


@router.post("/estimate-cost")
async def estimate_cost(
    model_ids: list[str],
    estimated_input_tokens: int = 1000,
    estimated_output_tokens: int = 2000,
) -> dict:
    """Estimate cost for a council configuration."""
    total_cost = 0.0
    breakdown = []

    for model_id in model_ids:
        model = next((m for m in AVAILABLE_MODELS if m.id == model_id), None)
        if model:
            input_cost = (estimated_input_tokens / 1000) * model.cost_per_1k_input
            output_cost = (estimated_output_tokens / 1000) * model.cost_per_1k_output
            model_cost = input_cost + output_cost
            total_cost += model_cost
            breakdown.append(
                {
                    "model_id": model_id,
                    "input_cost": input_cost,
                    "output_cost": output_cost,
                    "total": model_cost,
                }
            )

    return {
        "total_estimated_cost": total_cost,
        "breakdown": breakdown,
        "input_tokens": estimated_input_tokens,
        "output_tokens": estimated_output_tokens,
    }
