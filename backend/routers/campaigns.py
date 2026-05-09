from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from database import get_session
from models.campaign import Campaign

router = APIRouter()


class CampaignCreate(BaseModel):
    name: str
    campaign_type: str
    goal: str = ""
    budget: float = 0.0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: str = ""


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    budget: Optional[float] = None
    spend: Optional[float] = None
    goal: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    calls: Optional[int] = None
    bookings: Optional[int] = None
    notes: Optional[str] = None


@router.get("/campaigns")
def list_campaigns(status: str = "", session: Session = Depends(get_session)):
    q = select(Campaign)
    if status:
        q = q.where(Campaign.status == status)
    items = session.exec(q.order_by(Campaign.created_at.desc())).all()
    return [_s(c) for c in items]


@router.post("/campaigns")
def create_campaign(data: CampaignCreate, session: Session = Depends(get_session)):
    c = Campaign(**data.model_dump())
    session.add(c)
    session.commit()
    session.refresh(c)
    return _s(c)


@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: int, session: Session = Depends(get_session)):
    c = session.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(404, "Campaign not found")
    return _s(c)


@router.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: int, data: CampaignUpdate, session: Session = Depends(get_session)):
    c = session.get(Campaign, campaign_id)
    if not c:
        raise HTTPException(404, "Campaign not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    c.updated_at = datetime.utcnow()
    session.add(c)
    session.commit()
    session.refresh(c)
    return _s(c)


@router.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, session: Session = Depends(get_session)):
    c = session.get(Campaign, campaign_id)
    if c:
        session.delete(c)
        session.commit()
    return {"ok": True}


def _s(c: Campaign) -> dict:
    return {
        "id": c.id, "name": c.name, "campaign_type": c.campaign_type,
        "status": c.status, "budget": c.budget, "spend": c.spend,
        "goal": c.goal, "start_date": str(c.start_date) if c.start_date else None,
        "end_date": str(c.end_date) if c.end_date else None,
        "impressions": c.impressions, "clicks": c.clicks,
        "calls": c.calls, "bookings": c.bookings, "notes": c.notes,
        "created_at": c.created_at.isoformat(),
    }
