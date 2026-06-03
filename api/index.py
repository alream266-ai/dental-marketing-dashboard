import sys
from pathlib import Path

# Add backend to path so Vercel can find all modules
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from main import app  # noqa: F401 - Vercel uses this
