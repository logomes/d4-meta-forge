from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import Build, BuildIn, BuildOut

router = APIRouter(prefix="/api/builds", tags=["builds"])


@router.get("", response_model=list[BuildOut])
def list_builds(class_name: str | None = None, session: Session = Depends(get_session)):
    stmt = select(Build)
    if class_name:
        stmt = stmt.where(Build.class_name == class_name)
    return session.exec(stmt).all()


@router.get("/{build_id}", response_model=BuildOut)
def get_build(build_id: str, session: Session = Depends(get_session)):
    build = session.get(Build, build_id)
    if not build:
        raise HTTPException(status_code=404, detail="build not found")
    return build


@router.post("", response_model=BuildOut, status_code=201)
def create_build(payload: BuildIn, session: Session = Depends(get_session)):
    build = Build(id=str(uuid.uuid4()), **payload.model_dump())
    session.add(build)
    session.commit()
    session.refresh(build)
    return build


@router.put("/{build_id}", response_model=BuildOut)
def update_build(build_id: str, payload: BuildIn, session: Session = Depends(get_session)):
    build = session.get(Build, build_id)
    if not build:
        raise HTTPException(status_code=404, detail="build not found")
    for key, value in payload.model_dump().items():
        setattr(build, key, value)
    build.updated_at = time.time()
    session.add(build)
    session.commit()
    session.refresh(build)
    return build


@router.delete("/{build_id}", status_code=204)
def delete_build(build_id: str, session: Session = Depends(get_session)):
    build = session.get(Build, build_id)
    if not build:
        raise HTTPException(status_code=404, detail="build not found")
    session.delete(build)
    session.commit()
