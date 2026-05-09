from sqlmodel import Session, select
from models.brand import BrandProfile
from models.review import Review
from services.claude_client import generate
from prompts.review_response import SYSTEM_TEMPLATE, USER_TEMPLATE


def get_brand_ctx(session: Session) -> dict:
    p = session.exec(select(BrandProfile).limit(1)).first()
    return {
        "practice_name": p.practice_name if p else "Our Dental Office",
        "location": p.location if p else "Maple Ridge, BC",
        "brand_tone": p.brand_tone if p else "warm and professional",
    }


def draft_response(review: Review, session: Session) -> str:
    ctx = get_brand_ctx(session)
    system = SYSTEM_TEMPLATE.format(**ctx)
    user = USER_TEMPLATE.format(
        reviewer_name=review.reviewer_name or "a patient",
        rating=review.rating,
        review_text=review.body,
    )
    return generate(system, user)


def analyze_sentiment(rating: int) -> str:
    if rating >= 4:
        return "positive"
    if rating == 3:
        return "neutral"
    return "negative"
