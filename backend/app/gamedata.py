"""Loads community-parsed game data (DiabloTools/d4data) cached locally.

Game assets remain the property of Blizzard Entertainment. We only read
publicly published, community-parsed JSON via scripts/fetch_gamedata.py.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from .config import settings


class GameDataError(RuntimeError):
    pass


@lru_cache(maxsize=64)
def load(category: str) -> list | dict:
    path = Path(settings.gamedata_dir) / f"{category}.json"
    if not path.exists():
        raise GameDataError(
            f"Game data '{category}' missing. Run scripts/fetch_gamedata.py first."
        )
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def search(category: str, query: str, limit: int = 20) -> list[dict]:
    rows = load(category)
    if isinstance(rows, dict):
        rows = list(rows.values())
    needle = query.lower()
    matches = [r for r in rows if needle in json.dumps(r, ensure_ascii=False).lower()]
    return matches[:limit]
