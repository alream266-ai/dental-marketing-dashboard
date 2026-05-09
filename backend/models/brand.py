from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import json


class BrandProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    practice_name: str = ""
    website_url: str = ""
    location: str = ""
    phone: str = ""
    address: str = ""
    brand_tone: str = ""
    mission: str = ""
    target_audience_json: str = "[]"
    services_json: str = "[]"
    value_props_json: str = "[]"
    doctor_names_json: str = "[]"
    accepts_new_patients: bool = True
    hours_summary: str = ""
    raw_content: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def target_audience(self):
        return json.loads(self.target_audience_json)

    @property
    def services(self):
        return json.loads(self.services_json)

    @property
    def value_props(self):
        return json.loads(self.value_props_json)

    @property
    def doctor_names(self):
        return json.loads(self.doctor_names_json)
