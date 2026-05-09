from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from pydantic import BaseModel
from database import get_session
from models.content import GeneratedContent
from services.content_pipeline import (
    generate_social_post, stream_social_post,
    generate_blog_post, stream_blog_post,
    generate_email, stream_email,
)
import json

router = APIRouter()


class SocialRequest(BaseModel):
    platform: str = "facebook"
    topic: str
    post_type: str = "educational"
    extra_details: str = ""
    save: bool = False


class BlogRequest(BaseModel):
    keyword: str
    word_count: int = 1000
    save: bool = False


class EmailRequest(BaseModel):
    email_type: str = "promotional"
    goal: str
    segment: str = "existing patients"
    offer: str = ""
    word_count: int = 200
    save: bool = False


def _sse_wrapper(generator):
    for chunk in generator:
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/generate/social")
def gen_social(req: SocialRequest, session: Session = Depends(get_session)):
    result = generate_social_post(req.platform, req.topic, req.post_type, req.extra_details, session)
    if req.save:
        session.add(GeneratedContent(
            content_type="social", platform=req.platform, topic=req.topic, body=result
        ))
        session.commit()
    return {"content": result}


@router.get("/generate/social/stream")
def stream_social(
    platform: str = "facebook", topic: str = "", post_type: str = "educational",
    extra_details: str = "", session: Session = Depends(get_session)
):
    gen = stream_social_post(platform, topic, post_type, extra_details, session)
    return StreamingResponse(_sse_wrapper(gen), media_type="text/event-stream")


@router.post("/generate/blog")
def gen_blog(req: BlogRequest, session: Session = Depends(get_session)):
    result = generate_blog_post(req.keyword, req.word_count, session)
    if req.save:
        session.add(GeneratedContent(
            content_type="blog", topic=req.keyword, body=result
        ))
        session.commit()
    return {"content": result}


@router.get("/generate/blog/stream")
def stream_blog(
    keyword: str = "", word_count: int = 1000, session: Session = Depends(get_session)
):
    gen = stream_blog_post(keyword, word_count, session)
    return StreamingResponse(_sse_wrapper(gen), media_type="text/event-stream")


@router.post("/generate/email")
def gen_email(req: EmailRequest, session: Session = Depends(get_session)):
    result = generate_email(req.email_type, req.goal, req.segment, req.offer, req.word_count, session)
    if req.save:
        session.add(GeneratedContent(
            content_type="email", topic=req.goal, body=result
        ))
        session.commit()
    return {"content": result}


@router.get("/generate/email/stream")
def stream_email_route(
    email_type: str = "promotional", goal: str = "", segment: str = "existing patients",
    offer: str = "", word_count: int = 200, session: Session = Depends(get_session)
):
    gen = stream_email(email_type, goal, segment, offer, word_count, session)
    return StreamingResponse(_sse_wrapper(gen), media_type="text/event-stream")


@router.get("/content")
def list_content(content_type: str = "", session: Session = Depends(get_session)):
    from sqlmodel import select
    q = select(GeneratedContent)
    if content_type:
        q = q.where(GeneratedContent.content_type == content_type)
    items = session.exec(q.order_by(GeneratedContent.created_at.desc()).limit(50)).all()
    return [{"id": i.id, "content_type": i.content_type, "platform": i.platform,
             "topic": i.topic, "status": i.status, "created_at": i.created_at.isoformat()} for i in items]


@router.delete("/content/{content_id}")
def delete_content(content_id: int, session: Session = Depends(get_session)):
    item = session.get(GeneratedContent, content_id)
    if item:
        session.delete(item)
        session.commit()
    return {"ok": True}
