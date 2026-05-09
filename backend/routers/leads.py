from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_session
from models.lead import Lead

router = APIRouter()


class LeadCreate(BaseModel):
    name: str
    email: str = ""
    phone: str = ""
    source: str = ""
    service_interest: str = ""
    campaign_id: Optional[int] = None
    notes: str = ""


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    source: Optional[str] = None
    service_interest: Optional[str] = None
    notes: Optional[str] = None
    campaign_id: Optional[int] = None


@router.get("/leads")
def list_leads(status: str = "", session: Session = Depends(get_session)):
    q = select(Lead)
    if status:
        q = q.where(Lead.status == status)
    items = session.exec(q.order_by(Lead.created_at.desc())).all()
    return [_s(l) for l in items]


@router.post("/leads")
def create_lead(data: LeadCreate, session: Session = Depends(get_session)):
    lead = Lead(**data.model_dump())
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return _s(lead)


@router.post("/leads/webhook")
def webhook_lead(data: LeadCreate, session: Session = Depends(get_session)):
    lead = Lead(**data.model_dump(), source=data.source or "website_form")
    session.add(lead)
    session.commit()
    return {"ok": True, "id": lead.id}


@router.get("/leads/{lead_id}")
def get_lead(lead_id: int, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    return _s(lead)


@router.put("/leads/{lead_id}")
def update_lead(lead_id: int, data: LeadUpdate, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Lead not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(lead, k, v)
    lead.updated_at = datetime.utcnow()
    session.add(lead)
    session.commit()
    session.refresh(lead)
    return _s(lead)


@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, session: Session = Depends(get_session)):
    lead = session.get(Lead, lead_id)
    if lead:
        session.delete(lead)
        session.commit()
    return {"ok": True}


def _s(l: Lead) -> dict:
    return {
        "id": l.id, "name": l.name, "email": l.email, "phone": l.phone,
        "source": l.source, "service_interest": l.service_interest,
        "status": l.status, "campaign_id": l.campaign_id, "notes": l.notes,
        "created_at": l.created_at.isoformat(), "updated_at": l.updated_at.isoformat(),
    }
