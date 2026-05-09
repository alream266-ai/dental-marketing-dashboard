from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class KPISnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    snapshot_date: datetime = Field(default_factory=datetime.utcnow)
    total_leads: int = 0
    new_leads_this_month: int = 0
    active_campaigns: int = 0
    avg_review_score: float = 0.0
    content_published_this_week: int = 0
    total_reviews: int = 0


class SEOKeyword(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    keyword: str
    search_intent: str = ""  # informational, transactional, navigational
    difficulty: str = ""  # low, medium, high
    priority: int = 0  # 1-10
    category: str = ""  # service, location, question
    created_at: datetime = Field(default_factory=datetime.utcnow)
