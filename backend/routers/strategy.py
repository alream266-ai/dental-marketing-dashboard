from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from pydantic import BaseModel
from database import get_session
from services.strategy_builder import stream_strategy
import json

router = APIRouter()


class StrategyRequest(BaseModel):
    timeframe: int = 90
    current_patients: int = 20
    target_patients: int = 35
    budget: str = "1000-1500"
    services_to_promote: str = "general dentistry, whitening"
    challenge: str = "attracting new patients"


def _sse(gen):
    for chunk in gen:
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/strategy/build")
def build_strategy_stream(req: StrategyRequest, session: Session = Depends(get_session)):
    gen = stream_strategy(
        req.timeframe, req.current_patients, req.target_patients,
        req.budget, req.services_to_promote, req.challenge, session
    )
    return StreamingResponse(_sse(gen), media_type="text/event-stream")
