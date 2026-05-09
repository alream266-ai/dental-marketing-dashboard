from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models.brand import BrandProfile
from services.brand_extractor import extract_brand_profile
import json

router = APIRouter()


class AnalyzeRequest(BaseModel):
    url: str


class BrandProfileUpdate(BaseModel):
    practice_name: str = ""
    brand_tone: str = ""
    mission: str = ""
    target_audience: list[str] = []
    services: list[str] = []
    value_props: list[str] = []
    phone: str = ""
    address: str = ""
    hours_summary: str = ""
    accepts_new_patients: bool = True


@router.post("/analyze-website")
async def analyze_website(req: AnalyzeRequest, session: Session = Depends(get_session)):
    try:
        profile = await extract_brand_profile(req.url)
        existing = session.exec(select(BrandProfile).limit(1)).first()
        if existing:
            skip = {"id", "created_at"}
            for field in profile.model_fields:
                if field not in skip:
                    setattr(existing, field, getattr(profile, field))
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return _serialize(existing)
        else:
            session.add(profile)
            session.commit()
            session.refresh(profile)
            return _serialize(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/brand-profile")
def get_brand_profile(session: Session = Depends(get_session)):
    profile = session.exec(select(BrandProfile).limit(1)).first()
    if not profile:
        return None
    return _serialize(profile)


@router.put("/brand-profile")
def update_brand_profile(data: BrandProfileUpdate, session: Session = Depends(get_session)):
    profile = session.exec(select(BrandProfile).limit(1)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No brand profile found. Analyze a website first.")
    profile.practice_name = data.practice_name
    profile.brand_tone = data.brand_tone
    profile.mission = data.mission
    profile.target_audience_json = json.dumps(data.target_audience)
    profile.services_json = json.dumps(data.services)
    profile.value_props_json = json.dumps(data.value_props)
    profile.phone = data.phone
    profile.address = data.address
    profile.hours_summary = data.hours_summary
    profile.accepts_new_patients = data.accepts_new_patients
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return _serialize(profile)


def _serialize(p: BrandProfile) -> dict:
    return {
        "id": p.id,
        "practice_name": p.practice_name,
        "website_url": p.website_url,
        "location": p.location,
        "phone": p.phone,
        "address": p.address,
        "brand_tone": p.brand_tone,
        "mission": p.mission,
        "target_audience": p.target_audience,
        "services": p.services,
        "value_props": p.value_props,
        "doctor_names": p.doctor_names,
        "accepts_new_patients": p.accepts_new_patients,
        "hours_summary": p.hours_summary,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
