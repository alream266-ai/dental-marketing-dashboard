from sqlmodel import Session, select
from models.brand import BrandProfile
from services.claude_client import generate, stream_generate
from prompts.strategy import SYSTEM_TEMPLATE, USER_TEMPLATE


def _get_ctx(session: Session) -> dict:
    p = session.exec(select(BrandProfile).limit(1)).first()
    return {
        "practice_name": p.practice_name if p else "Our Dental Office",
        "location": p.location if p else "Maple Ridge, BC",
        "brand_tone": p.brand_tone if p else "professional",
        "services": ", ".join(p.services) if p and p.services else "general dentistry",
        "target_audience": ", ".join(p.target_audience) if p and p.target_audience else "families",
    }


def build_strategy(
    timeframe: int, current_patients: int, target_patients: int,
    budget: str, services_to_promote: str, challenge: str, session: Session
) -> str:
    ctx = _get_ctx(session)
    system = SYSTEM_TEMPLATE.format(**ctx)
    user = USER_TEMPLATE.format(
        timeframe=timeframe, current_patients=current_patients,
        target_patients=target_patients, budget=budget,
        services_to_promote=services_to_promote, challenge=challenge,
    )
    return generate(system, user)


def stream_strategy(
    timeframe: int, current_patients: int, target_patients: int,
    budget: str, services_to_promote: str, challenge: str, session: Session
):
    ctx = _get_ctx(session)
    system = SYSTEM_TEMPLATE.format(**ctx)
    user = USER_TEMPLATE.format(
        timeframe=timeframe, current_patients=current_patients,
        target_patients=target_patients, budget=budget,
        services_to_promote=services_to_promote, challenge=challenge,
    )
    return stream_generate(system, user)
