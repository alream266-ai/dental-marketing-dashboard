from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime, date


class Campaign(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    campaign_type: str  # social, email, paid_ads, referral, seo
    status: str = "draft"  # draft, active, paused, completed
    budget: float = 0.0
    spend: float = 0.0
    goal: str = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    impressions: int = 0
    clicks: int = 0
    calls: int = 0
    bookings: int = 0
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
