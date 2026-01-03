"""System prompts for different council member roles."""

from typing import Optional, List, Dict, Union, Any

ROLE_SYSTEM_PROMPTS = {
    "thinker": """You are a thoughtful analyst participating in a council deliberation.

Your role is to provide deep, analytical reasoning on the question at hand.
- Break down complex problems into components
- Consider multiple angles and perspectives
- Support your reasoning with logical arguments
- Be thorough but focused

Provide a well-structured response that demonstrates careful thinking.""",

    "critic": """You are a critical analyst participating in a council deliberation.

Your role is to identify potential weaknesses, gaps, and areas of concern.
- Question assumptions that others might take for granted
- Identify logical flaws or unsupported claims
- Point out risks and potential downsides
- Ensure claims are well-supported

Be constructive in your criticism - the goal is to strengthen the final outcome.""",

    "devils_advocate": """You are a devil's advocate participating in a council deliberation.

Your role is to challenge the prevailing viewpoint and explore alternatives.
- Present counterarguments even if you don't personally agree
- Consider worst-case scenarios
- Challenge popular or consensus opinions
- Explore unconventional or minority perspectives

Your goal is to ensure the council doesn't fall into groupthink.""",

    "chair": """You are the chairman synthesizing the council's deliberation.

Your role is to:
- Integrate insights from all council members
- Identify areas of agreement and disagreement
- Weigh different perspectives based on their merit
- Produce a clear, actionable synthesis

Be fair to all viewpoints while producing a coherent final answer.""",
}


def build_reasoning_prompt(
    user_prompt: str,
    role: str,
    objective: Optional[str] = None,
    constraints: Optional[List[str]] = None,
    audience: Optional[str] = None,
    context: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    supports_vision: bool = False,
) -> List[Dict]:
    """Build the messages for the reasoning phase.

    Args:
        user_prompt: The main question/task content
        role: The council member role (thinker, critic, devils_advocate, chair)
        objective: Optional objective for the task
        constraints: Optional list of constraints
        audience: Optional target audience
        context: Optional additional context
        attachments: Optional list of attachments with type, filename, public_url, etc.
        supports_vision: Whether the model supports vision/multimodal input

    Returns:
        List of message dicts for the LLM API
    """
    system_prompt = ROLE_SYSTEM_PROMPTS.get(role, ROLE_SYSTEM_PROMPTS["thinker"])

    user_text = f"## Question\n{user_prompt}\n"

    if objective:
        user_text += f"\n## Objective\n{objective}\n"
    if audience:
        user_text += f"\n## Target Audience\n{audience}\n"
    if context:
        user_text += f"\n## Additional Context\n{context}\n"
    if constraints:
        user_text += f"\n## Constraints\n" + "\n".join(f"- {c}" for c in constraints) + "\n"

    # Handle attachments
    if attachments and len(attachments) > 0:
        # Separate images from text-based files - only images can be sent as image_url
        images = [att for att in attachments if att.get("type") == "image"]
        text_files = [att for att in attachments if att.get("type") in ("pdf", "text")]

        if supports_vision and images:
            # For vision-capable models with images, use multimodal content
            user_text += "\n## Attachments\nPlease analyze the attached files as part of your response.\n"

            # Add text-based files (PDFs, .txt, .md) as text content
            if text_files:
                user_text += "\n### Text Documents\n"
                for doc in text_files:
                    filename = doc.get('filename', 'document')
                    if doc.get("extracted_text"):
                        text = doc["extracted_text"]
                        # Include up to 15000 chars of extracted text
                        user_text += f"\n**{filename}** (content):\n{text[:15000]}{'...[truncated]' if len(text) > 15000 else ''}\n"
                    else:
                        user_text += f"- {filename} (no text could be extracted)\n"

            user_text += "\nPlease provide your analysis."

            # Build multimodal content array
            content_parts: List[Dict[str, Any]] = [{"type": "text", "text": user_text}]

            # Only add actual images as image_url
            for img in images:
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": img["public_url"]}
                })

            return [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content_parts},
            ]
        else:
            # For non-vision models or PDFs-only, include text descriptions
            user_text += "\n## Attached Files\n"
            if not supports_vision:
                user_text += "Note: This model cannot view images directly.\n"

            for att in attachments:
                att_type = att.get("type", "file")
                filename = att.get("filename", "unknown")
                if att.get("extracted_text"):
                    text = att["extracted_text"]
                    # Include up to 15000 chars of extracted text
                    user_text += f"\n**{filename}** ({att_type}, extracted text):\n{text[:15000]}{'...[truncated]' if len(text) > 15000 else ''}\n"
                else:
                    user_text += f"- {att_type.upper()}: {filename} (no text could be extracted)\n"

    user_text += "\nPlease provide your analysis."

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_text},
    ]


def build_review_prompt(
    original_prompt: str,
    responses: List[Dict],  # [{label: "A", content: "...", model_id: "hidden"}]
    reviewer_role: str,
) -> List[Dict]:
    """Build the messages for the peer review phase."""
    system_prompt = f"""You are reviewing responses from other council members.

{ROLE_SYSTEM_PROMPTS.get(reviewer_role, ROLE_SYSTEM_PROMPTS["thinker"])}

Review each response and provide a score from 0-10 with a brief rationale.

IMPORTANT: You MUST format each score exactly like this:
Response A: 8/10
Rationale: Your reasoning here.

Response B: 7/10
Rationale: Your reasoning here.

Be fair and objective. Consider accuracy, completeness, clarity, and relevance."""

    responses_text = ""
    for resp in responses:
        responses_text += f"\n### Response {resp['label']}\n{resp['content']}\n"

    # Build example format based on actual labels
    labels = [resp['label'] for resp in responses]
    example_format = "\n".join([f"Response {label}: [SCORE]/10\nRationale: [Your reasoning]\n" for label in labels])

    user_content = f"""## Original Question
{original_prompt}

## Responses to Review
{responses_text}

## Your Task
Score each response from 0-10 and explain your reasoning.

Use this exact format for each response:
{example_format}"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]


def build_synthesis_prompt(
    original_prompt: str,
    responses: List[Dict],  # [{role: "thinker", content: "..."}]
    reviews: List[Dict],  # [{reviewer: "...", scores: [{label: "A", score: 8}]}]
    objective: Optional[str] = None,
) -> List[Dict]:
    """Build the messages for the synthesis phase."""
    system_prompt = ROLE_SYSTEM_PROMPTS["chair"]

    responses_text = ""
    for i, resp in enumerate(responses):
        label = chr(65 + i)  # A, B, C...
        responses_text += f"\n### Response {label} (Role: {resp['role']})\n{resp['content']}\n"

    reviews_summary = "\n## Peer Review Summary\n"
    # Aggregate scores by response
    score_totals: Dict[str, List[float]] = {}
    for review in reviews:
        for score_entry in review.get("scores", []):
            label = score_entry["label"]
            score = score_entry["score"]
            if label not in score_totals:
                score_totals[label] = []
            score_totals[label].append(score)

    for label in sorted(score_totals.keys()):
        scores = score_totals[label]
        avg = sum(scores) / len(scores) if scores else 0
        reviews_summary += f"- Response {label}: Average score {avg:.1f}/10\n"

    user_content = f"""## Original Question
{original_prompt}
"""
    if objective:
        user_content += f"\n## Objective\n{objective}\n"

    user_content += f"""
## Council Responses
{responses_text}
{reviews_summary}

## Your Task
Synthesize the council's deliberation into a coherent final answer.

Include:
1. **Summary**: A clear, direct answer to the question
2. **Key Agreements**: Points where the council members aligned
3. **Key Disagreements**: Points of contention and how you resolved them
4. **Confidence Level**: Your confidence in this synthesis (Low/Medium/High)
5. **Recommendations**: Actionable next steps if applicable"""

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_content},
    ]
