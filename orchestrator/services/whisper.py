"""OpenAI Whisper transcription service."""

from typing import Optional

import httpx
from config import get_settings

WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions"
WHISPER_MODEL = "whisper-1"
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB (OpenAI limit)

# Supported audio formats
SUPPORTED_FORMATS = {
    "audio/webm",
    "audio/webm;codecs=opus",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/m4a",
    "audio/ogg",
    "audio/flac",
}


class TranscriptionError(Exception):
    """Error during audio transcription."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


async def transcribe_audio(
    audio_data: bytes,
    filename: str,
    content_type: str,
) -> str:
    """
    Transcribe audio using OpenAI Whisper API.

    Args:
        audio_data: Raw audio bytes
        filename: Original filename (for format detection)
        content_type: MIME type of the audio

    Returns:
        Transcribed text string

    Raises:
        TranscriptionError: If validation fails or API call fails
    """
    settings = get_settings()

    # Check if OpenAI API key is configured
    if not settings.openai_api_key:
        raise TranscriptionError(
            "OpenAI API key not configured. Set OPENAI_API_KEY environment variable.",
            status_code=503,
        )

    # Validate file size
    if len(audio_data) > MAX_FILE_SIZE:
        raise TranscriptionError(
            f"Audio file too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB.",
            status_code=413,
        )

    if len(audio_data) == 0:
        raise TranscriptionError(
            "Audio file is empty.",
            status_code=400,
        )

    # Validate content type (normalize by removing codec info for comparison)
    base_content_type = content_type.split(";")[0].strip().lower()
    if base_content_type not in SUPPORTED_FORMATS and content_type.lower() not in SUPPORTED_FORMATS:
        raise TranscriptionError(
            f"Unsupported audio format: {content_type}. "
            f"Supported formats: webm, wav, mp3, mp4, m4a, ogg, flac",
            status_code=415,
        )

    # Determine file extension for the API
    ext = _get_extension(filename, content_type)

    # Call OpenAI Whisper API
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                WHISPER_URL,
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                },
                files={
                    "file": (f"audio.{ext}", audio_data, content_type),
                },
                data={
                    "model": WHISPER_MODEL,
                    "response_format": "text",
                },
            )

            if response.status_code == 200:
                text = response.text.strip()
                if not text:
                    raise TranscriptionError(
                        "No speech detected in the audio.",
                        status_code=422,
                    )
                return text

            # Handle specific error codes
            if response.status_code == 401:
                raise TranscriptionError(
                    "Invalid OpenAI API key.",
                    status_code=401,
                )
            elif response.status_code == 429:
                raise TranscriptionError(
                    "OpenAI rate limit exceeded. Please try again later.",
                    status_code=429,
                )
            else:
                error_detail = response.text[:200] if response.text else "Unknown error"
                raise TranscriptionError(
                    f"Transcription failed: {error_detail}",
                    status_code=response.status_code,
                )

        except httpx.TimeoutException:
            raise TranscriptionError(
                "Transcription request timed out. Please try a shorter recording.",
                status_code=504,
            )
        except httpx.RequestError as e:
            raise TranscriptionError(
                f"Network error during transcription: {str(e)}",
                status_code=503,
            )


def _get_extension(filename: str, content_type: str) -> str:
    """Determine file extension from filename or content type."""
    # Try to get from filename first
    if "." in filename:
        ext = filename.rsplit(".", 1)[-1].lower()
        if ext in {"webm", "wav", "mp3", "mp4", "m4a", "ogg", "flac", "mpeg"}:
            return ext

    # Fall back to content type
    content_map = {
        "audio/webm": "webm",
        "audio/wav": "wav",
        "audio/wave": "wav",
        "audio/x-wav": "wav",
        "audio/mp3": "mp3",
        "audio/mpeg": "mp3",
        "audio/mp4": "mp4",
        "audio/m4a": "m4a",
        "audio/ogg": "ogg",
        "audio/flac": "flac",
    }

    base_type = content_type.split(";")[0].strip().lower()
    return content_map.get(base_type, "webm")
