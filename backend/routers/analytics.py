from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from database import get_session
from models.campaign import Campaign
from models.lead import Lead
from models.review import Review
from models.content import GeneratedContent
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/analytics/kpis")
def get_kpis(session: Session = Depends(get_session)):
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0)
    week_start = now - timedelta(days=7)

    total_leads = session.exec(select(func.count(Lead.id))).one()
    new_leads_month = session.exec(
        select(func.count(Lead.id)).where(Lead.created_at >= month_start)
    ).one()
    active_campaigns = session.exec(
        select(func.count(Campaign.id)).where(Campaign.status == "active")
    ).one()
    content_this_week = session.exec(
        select(func.count(GeneratedContent.id)).where(GeneratedContent.created_at >= week_start)
    ).one()

    reviews = session.exec(select(Review)).all()
    avg_review = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0.0

    return {
        "total_leads": total_leads,
        "new_leads_this_month": new_leads_month,
        "active_campaigns": active_campaigns,
        "avg_review_score": avg_review,
        "total_reviews": len(reviews),
        "content_published_this_week": content_this_week,
    }


@router.get("/analytics/leads-over-time")
def leads_over_time(session: Session = Depends(get_session)):
    leads = session.exec(select(Lead).order_by(Lead.created_at)).all()
    months: dict = {}
    for l in leads:
        key = l.created_at.strftime("%b %Y")
        months[key] = months.get(key, 0) + 1
    return [{"month": k, "count": v} for k, v in months.items()]


@router.get("/analytics/leads-by-source")
def leads_by_source(session: Session = Depends(get_session)):
    leads = session.exec(select(Lead)).all()
    sources: dict = {}
    for l in leads:
        s = l.source or "Unknown"
        sources[s] = sources.get(s, 0) + 1
    return [{"source": k, "count": v} for k, v in sources.items()]


@router.get("/analytics/campaign-performance")
def campaign_performance(session: Session = Depends(get_session)):
    campaigns = session.exec(select(Campaign)).all()
    return [{
        "name": c.name, "type": c.campaign_type,
        "budget": c.budget, "spend": c.spend,
        "impressions": c.impressions, "clicks": c.clicks,
        "bookings": c.bookings,
        "cpl": round(c.spend / c.bookings, 2) if c.bookings > 0 else 0,
    } for c in campaigns]
