import json
import logging

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)


class AIServiceError(Exception):
    """Raised when the AI service fails to produce a usable response."""


_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "GEMINI_API_KEY is not configured. Add it to your .env file."
        )
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def generate_structured_json(
    prompt: str,
    system_instruction: str,
    temperature: float = 0.4,
) -> dict | list:
    """
    Calls Gemini and parses the response as JSON.
    Raises AIServiceError on any failure (network, API, or malformed JSON)
    so callers can decide how to handle/fallback.
    """
    client = _get_client()

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temperature,
                response_mime_type="application/json",
            ),
        )
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise AIServiceError(f"Gemini API call failed: {exc}") from exc

    raw_text = (response.text or "").strip()
    if not raw_text:
        raise AIServiceError("Gemini returned an empty response.")

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        logger.error("Gemini returned non-JSON response: %s", raw_text[:500])
        raise AIServiceError(f"Gemini returned invalid JSON: {exc}") from exc