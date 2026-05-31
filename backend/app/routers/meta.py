from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..config import settings
from ..db import get_session
from ..gamedata import GameDataError, search
from ..models import PatchNote, SourceRef

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/current-patch")
def current_patch():
    return {"patch": settings.current_patch}


@router.get("/sources", response_model=list[SourceRef])
def list_sources(site: str | None = None, session: Session = Depends(get_session)):
    stmt = select(SourceRef)
    if site:
        stmt = stmt.where(SourceRef.site == site)
    return session.exec(stmt).all()


@router.get("/patch/latest", response_model=PatchNote | None)
def latest_patch(session: Session = Depends(get_session)):
    return session.exec(
        select(PatchNote).order_by(PatchNote.fetched_at.desc())
    ).first()


@router.get("/gamedata/{category}")
def gamedata_search(category: str, q: str = Query(""), limit: int = 20):
    try:
        return search(category, q, limit)
    except GameDataError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
