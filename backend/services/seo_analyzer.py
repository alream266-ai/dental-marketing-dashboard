import json
from sqlmodel import Session, select
from models.brand import BrandProfile
from models.analytics import SEOKeyword
from services.claude_client import generate
from prompts.seo_keywords import SYSTEM, USER_TEMPLATE


def generate_keywords(services: list[str], session: Session) -> list[dict]:
    services_str = ", ".join(services) if services else "general dentistry"
    user = USER_TEMPLATE.format(services=services_str)
    response = generate(SYSTEM, user)

    start = response.find("[")
    end = response.rfind("]") + 1
    keywords = json.loads(response[start:end])

    for kw in keywords:
        existing = session.exec(
            select(SEOKeyword).where(SEOKeyword.keyword == kw["keyword"])
        ).first()
        if not existing:
            session.add(SEOKeyword(
                keyword=kw["keyword"],
                search_intent=kw.get("search_intent", ""),
                difficulty=kw.get("difficulty", "medium"),
                priority=kw.get("priority", 5),
                category=kw.get("category", "service"),
            ))
    session.commit()
    return keywords
