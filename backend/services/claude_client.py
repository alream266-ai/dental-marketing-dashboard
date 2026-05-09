import anthropic
from config import get_settings

settings = get_settings()

if not settings.anthropic_api_key:
    raise ValueError("ANTHROPIC_API_KEY is not set in backend/.env file")

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)


def generate(system_prompt: str, user_prompt: str, use_cache: bool = True) -> str:
    system_block = {"type": "text", "text": system_prompt}
    if use_cache:
        system_block["cache_control"] = {"type": "ephemeral"}

    message = client.messages.create(
        model=settings.model,
        max_tokens=4096,
        system=[system_block],
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def stream_generate(system_prompt: str, user_prompt: str):
    system_block = {"type": "text", "text": system_prompt, "cache_control": {"type": "ephemeral"}}

    with client.messages.stream(
        model=settings.model,
        max_tokens=4096,
        system=[system_block],
        messages=[{"role": "user", "content": user_prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text
