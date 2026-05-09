from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models.analytics import SEOKeyword
from models.brand import BrandProfile
from services.seo_analyzer import generate_keywords

router = APIRouter()


class KeywordRequest(BaseModel):
    services: list[str] = []


@router.post("/seo/keywords")
def generate_seo_keywords(req: KeywordRequest, session: Session = Depends(get_session)):
    services = req.services
    if not services:
        profile = session.exec(select(BrandProfile).limit(1)).first()
        services = profile.services if profile and profile.services else ["general dentistry"]
    keywords = generate_keywords(services, session)
    return {"keywords": keywords, "count": len(keywords)}


@router.get("/seo/keywords")
def list_keywords(session: Session = Depends(get_session)):
    items = session.exec(select(SEOKeyword).order_by(SEOKeyword.priority.desc())).all()
    return [{"id": k.id, "keyword": k.keyword, "search_intent": k.search_intent,
             "difficulty": k.difficulty, "priority": k.priority, "category": k.category} for k in items]


@router.delete("/seo/keywords/{keyword_id}")
def delete_keyword(keyword_id: int, session: Session = Depends(get_session)):
    k = session.get(SEOKeyword, keyword_id)
    if k:
        session.delete(k)
        session.commit()
    return {"ok": True}


@router.get("/seo/schema-markup")
def generate_schema(session: Session = Depends(get_session)):
    profile = session.exec(select(BrandProfile).limit(1)).first()
    if not profile:
        return {"schema": "{}"}

    schema = {
        "@context": "https://schema.org",
        "@type": "Dentist",
        "name": profile.practice_name,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": profile.address,
            "addressLocality": "Maple Ridge",
            "addressRegion": "BC",
            "addressCountry": "CA"
        },
        "telephone": profile.phone,
        "url": profile.website_url,
        "openingHours": profile.hours_summary,
        "servesCuisine": None,
        "priceRange": "$$",
        "description": profile.mission,
    }
    import json
    return {"schema": json.dumps(schema, indent=2)}
