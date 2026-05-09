from sqlmodel import Session, select
from models.brand import BrandProfile
from services.claude_client import generate, stream_generate
from prompts import social_media, blog_writing, email_campaigns
import json


def _get_brand_context(session: Session) -> dict:
    profile = session.exec(select(BrandProfile).limit(1)).first()
    if not profile:
        return {
            "practice_name": "Our Dental Office",
            "location": "Maple Ridge, BC",
            "brand_tone": "warm and professional",
            "services": "general dentistry, cleanings, whitening",
            "target_audience": "families and adults",
        }
    return {
        "practice_name": profile.practice_name or "Our Dental Office",
        "location": profile.location or "Maple Ridge, BC",
        "brand_tone": profile.brand_tone or "warm and professional",
        "services": ", ".join(profile.services) if profile.services else "general dentistry",
        "target_audience": ", ".join(profile.target_audience) if profile.target_audience else "families",
    }


def generate_social_post(
    platform: str, topic: str, post_type: str, extra_details: str, session: Session
) -> str:
    ctx = _get_brand_context(session)
    system = social_media.SYSTEM_TEMPLATE.format(**ctx)
    user = social_media.USER_TEMPLATE.format(
        platform=platform, topic=topic, post_type=post_type,
        extra_details=extra_details or ""
    )
    return generate(system, user)


def stream_social_post(platform: str, topic: str, post_type: str, extra_details: str, session: Session):
    ctx = _get_brand_context(session)
    system = social_media.SYSTEM_TEMPLATE.format(**ctx)
    user = social_media.USER_TEMPLATE.format(
        platform=platform, topic=topic, post_type=post_type,
        extra_details=extra_details or ""
    )
    return stream_generate(system, user)


def generate_blog_post(keyword: str, word_count: int, session: Session) -> str:
    ctx = _get_brand_context(session)
    system = blog_writing.SYSTEM_TEMPLATE.format(**ctx)
    user = blog_writing.USER_TEMPLATE.format(
        keyword=keyword, word_count=word_count,
        practice_name=ctx["practice_name"]
    )
    return generate(system, user)


def stream_blog_post(keyword: str, word_count: int, session: Session):
    ctx = _get_brand_context(session)
    system = blog_writing.SYSTEM_TEMPLATE.format(**ctx)
    user = blog_writing.USER_TEMPLATE.format(
        keyword=keyword, word_count=word_count,
        practice_name=ctx["practice_name"]
    )
    return stream_generate(system, user)


def generate_email(
    email_type: str, goal: str, segment: str, offer: str, word_count: int, session: Session
) -> str:
    ctx = _get_brand_context(session)
    system = email_campaigns.SYSTEM_TEMPLATE.format(**ctx)
    user = email_campaigns.USER_TEMPLATE.format(
        email_type=email_type, goal=goal, segment=segment,
        offer=offer, word_count=word_count,
        practice_name=ctx["practice_name"]
    )
    return generate(system, user)


def stream_email(
    email_type: str, goal: str, segment: str, offer: str, word_count: int, session: Session
):
    ctx = _get_brand_context(session)
    system = email_campaigns.SYSTEM_TEMPLATE.format(**ctx)
    user = email_campaigns.USER_TEMPLATE.format(
        email_type=email_type, goal=goal, segment=segment,
        offer=offer, word_count=word_count,
        practice_name=ctx["practice_name"]
    )
    return stream_generate(system, user)
