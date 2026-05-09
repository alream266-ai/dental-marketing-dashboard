from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class GeneratedContent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content_type: str  # social, blog, email
    platform: str = ""  # facebook, instagram, google_business, email
    topic: str = ""
    body: str = ""
    subject_line: str = ""
    hashtags: str = ""
    campaign_id: Optional[int] = None
    status: str = "draft"  # draft, approved, published
    created_at: datetime = Field(default_factory=datetime.utcnow)
