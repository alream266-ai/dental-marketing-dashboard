from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Review(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    reviewer_name: str = ""
    rating: int  # 1-5
    body: str = ""
    platform: str = "google"
    response_draft: str = ""
    response_posted: str = ""
    status: str = "pending"  # pending, responded
    sentiment: str = ""  # positive, neutral, negative
    review_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
