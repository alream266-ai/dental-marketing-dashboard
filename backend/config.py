from dotenv import dotenv_values
from pathlib import Path
import os

# Load .env file for local development
_env = dotenv_values(Path(__file__).parent / ".env")


def _get(key: str, default: str = "") -> str:
    # Environment variables (Vercel) take priority over .env file
    return os.environ.get(key) or _env.get(key, default)


class Settings:
    anthropic_api_key: str = _get("ANTHROPIC_API_KEY")
    google_places_api_key: str = _get("GOOGLE_PLACES_API_KEY")
    # Optional remote headless-browser API (e.g. Browserless) used for the SEO
    # audit's rendered-DOM mode on serverless hosts where local Chromium can't
    # run. When unset, the audit falls back to static HTML.
    browserless_api_key: str = _get("BROWSERLESS_API_KEY")
    browserless_url: str = _get("BROWSERLESS_URL", "https://production-sfo.browserless.io")
    # Supports both SQLite (local) and PostgreSQL (Vercel/Neon)
    database_url: str = _get("DATABASE_URL", "sqlite:///./dental_marketing.db")
    model: str = "claude-sonnet-4-6"


_settings = Settings()


def get_settings() -> Settings:
    return _settings
