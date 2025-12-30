"""Prompt enhancement service using fast LLM calls."""

import json
from dataclasses import dataclass
from typing import Optional

from services.openrouter import get_openrouter_client


@dataclass
class EnhancedPrompt:
    """Enhanced prompt with suggestions."""
    original_content: str
    enhanced_content: str
    suggested_objective: Optional[str] = None
    suggested_constraints: list[str] = None
    suggested_context: Optional[str] = None
    suggested_audience: Optional[str] = None
    improvements: list[str] = None

    def __post_init__(self):
        if self.suggested_constraints is None:
            self.suggested_constraints = []
        if self.improvements is None:
            self.improvements = []


# Fast model for prompt enhancement (prioritize speed)
ENHANCEMENT_MODEL = "google/gemini-2.0-flash-001"
FALLBACK_MODEL = "openai/gpt-4o-mini"

ENHANCEMENT_SYSTEM_PROMPT = """You are an expert prompt engineer helping users create effective prompts for an AI council deliberation system.

The council consists of multiple AI models that will:
1. Independently reason about the user's question
2. Peer-review each other's responses
3. Synthesize a final consensus answer

Your job is to enhance the user's prompt to get better results from the council.

Analyze the prompt and provide:
1. An enhanced version of the main question that is clearer and more specific
2. A suggested objective (what outcome they want)
3. Key constraints to consider (2-4 relevant constraints)
4. Any important context that should be added
5. The target audience (who this is for)
6. A list of 2-3 specific improvements you made

Return your response as valid JSON with this structure:
{
  "enhanced_content": "The enhanced main question",
  "suggested_objective": "What outcome they're looking for",
  "suggested_constraints": ["constraint1", "constraint2"],
  "suggested_context": "Additional context or null if not needed",
  "suggested_audience": "Target audience or null if general",
  "improvements": ["improvement1", "improvement2", "improvement3"]
}

Guidelines:
- Keep enhancements concise and actionable
- Don't change the fundamental intent of the question
- Add structure where it helps, but don't over-complicate simple questions
- Focus on clarity, specificity, and completeness
- Constraints should be realistic and relevant
- If the prompt is already good, make minimal changes and note that

Return ONLY valid JSON, no markdown formatting or explanation."""


async def enhance_prompt(
    content: str,
    objective: Optional[str] = None,
    constraints: Optional[list[str]] = None,
    context: Optional[str] = None,
    audience: Optional[str] = None,
) -> EnhancedPrompt:
    """Enhance a user prompt using AI suggestions.

    Args:
        content: The main prompt content
        objective: Optional existing objective
        constraints: Optional existing constraints
        context: Optional existing context
        audience: Optional existing audience

    Returns:
        EnhancedPrompt with suggestions
    """
    client = get_openrouter_client()

    # Build user message with existing prompt details
    user_message = f"Please enhance this prompt for an AI council deliberation:\n\n"
    user_message += f"**Main Question:**\n{content}\n"

    if objective:
        user_message += f"\n**Current Objective:**\n{objective}\n"
    if constraints:
        user_message += f"\n**Current Constraints:**\n" + "\n".join(f"- {c}" for c in constraints) + "\n"
    if context:
        user_message += f"\n**Current Context:**\n{context}\n"
    if audience:
        user_message += f"\n**Target Audience:**\n{audience}\n"

    messages = [
        {"role": "system", "content": ENHANCEMENT_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    try:
        # Try fast model first
        result = await client.complete(
            model=ENHANCEMENT_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7,
        )
    except Exception as e:
        print(f"Enhancement with {ENHANCEMENT_MODEL} failed: {e}, trying fallback")
        try:
            result = await client.complete(
                model=FALLBACK_MODEL,
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )
        except Exception as e2:
            print(f"Fallback enhancement also failed: {e2}")
            # Return original prompt unchanged
            return EnhancedPrompt(
                original_content=content,
                enhanced_content=content,
                improvements=["Unable to enhance - AI service temporarily unavailable"],
            )

    # Parse JSON response
    try:
        # Clean up potential markdown formatting
        response_text = result.content.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        data = json.loads(response_text)

        return EnhancedPrompt(
            original_content=content,
            enhanced_content=data.get("enhanced_content", content),
            suggested_objective=data.get("suggested_objective"),
            suggested_constraints=data.get("suggested_constraints", []),
            suggested_context=data.get("suggested_context"),
            suggested_audience=data.get("suggested_audience"),
            improvements=data.get("improvements", []),
        )
    except json.JSONDecodeError as e:
        print(f"Failed to parse enhancement response: {e}")
        print(f"Response was: {result.content[:500]}")
        # Return original with the raw response as enhanced content
        return EnhancedPrompt(
            original_content=content,
            enhanced_content=result.content,
            improvements=["Response parsing failed - raw enhancement returned"],
        )
