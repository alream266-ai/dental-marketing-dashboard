from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Lead(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = ""
    phone: str = ""
    source: str = ""  # website, referral, google, social, campaign_id
    service_interest: str = ""
    status: str = "new"  # new, contacted, appointment_booked, converted, lost
    campaign_id: Optional[int] = None
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
