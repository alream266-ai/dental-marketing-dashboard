from dotenv import dotenv_values
from pathlib import Path

_env = dotenv_values(Path(__file__).parent / ".env")


class Settings:
    anthropic_api_key: str = _env.get("ANTHROPIC_API_KEY", "")
    google_places_api_key: str = _env.get("GOOGLE_PLACES_API_KEY", "")
    database_url: str = _env.get("DATABASE_URL", "sqlite:///./dental_marketing.db")
    model: str = "claude-sonnet-4-6"


_settings = Settings()


def get_settings() -> Settings:
    return _settings
