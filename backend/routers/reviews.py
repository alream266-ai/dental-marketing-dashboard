from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_session
from models.review import Review
from services.review_fetcher import draft_response, analyze_sentiment

router = APIRouter()


class ReviewCreate(BaseModel):
    reviewer_name: str = ""
    rating: int
    body: str = ""
    platform: str = "google"
    review_date: Optional[datetime] = None


class ReviewUpdate(BaseModel):
    response_posted: Optional[str] = None
    status: Optional[str] = None


@router.get("/reviews")
def list_reviews(status: str = "", session: Session = Depends(get_session)):
    q = select(Review)
    if status:
        q = q.where(Review.status == status)
    items = session.exec(q.order_by(Review.created_at.desc())).all()
    return [_s(r) for r in items]


@router.post("/reviews")
def create_review(data: ReviewCreate, session: Session = Depends(get_session)):
    r = Review(**data.model_dump(), sentiment=analyze_sentiment(data.rating))
    session.add(r)
    session.commit()
    session.refresh(r)
    return _s(r)


@router.post("/reviews/import")
def import_reviews(reviews: list[ReviewCreate], session: Session = Depends(get_session)):
    for data in reviews:
        r = Review(**data.model_dump(), sentiment=analyze_sentiment(data.rating))
        session.add(r)
    session.commit()
    return {"imported": len(reviews)}


@router.post("/reviews/{review_id}/draft-response")
def draft_review_response(review_id: int, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    draft = draft_response(review, session)
    review.response_draft = draft
    session.add(review)
    session.commit()
    return {"draft": draft}


@router.put("/reviews/{review_id}")
def update_review(review_id: int, data: ReviewUpdate, session: Session = Depends(get_session)):
    review = session.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(review, k, v)
    session.add(review)
    session.commit()
    return _s(review)


@router.get("/reviews/summary")
def reviews_summary(session: Session = Depends(get_session)):
    reviews = session.exec(select(Review)).all()
    if not reviews:
        return {"total": 0, "avg_rating": 0, "positive": 0, "neutral": 0, "negative": 0, "pending": 0}
    total = len(reviews)
    avg = sum(r.rating for r in reviews) / total
    return {
        "total": total,
        "avg_rating": round(avg, 1),
        "positive": sum(1 for r in reviews if r.sentiment == "positive"),
        "neutral": sum(1 for r in reviews if r.sentiment == "neutral"),
        "negative": sum(1 for r in reviews if r.sentiment == "negative"),
        "pending": sum(1 for r in reviews if r.status == "pending"),
    }


def _s(r: Review) -> dict:
    return {
        "id": r.id, "reviewer_name": r.reviewer_name, "rating": r.rating,
        "body": r.body, "platform": r.platform, "sentiment": r.sentiment,
        "response_draft": r.response_draft, "response_posted": r.response_posted,
        "status": r.status, "review_date": r.review_date.isoformat() if r.review_date else None,
        "created_at": r.created_at.isoformat(),
    }
