#!/usr/bin/env python3
"""Fetch community-parsed game-data JSON (DiabloTools/d4data) into a local cache.

Game assets remain the property of Blizzard Entertainment. This script only
caches publicly published, community-parsed JSON for local use by the planner
and damage calculator. Review the upstream repo and Blizzard's ToS before use.
"""
from __future__ import annotations

import sys
from pathlib import Path

import httpx

RAW_BASE = "https://raw.githubusercontent.com/DiabloTools/d4data/master"

# Map local category -> upstream path. Fill with the repo's current layout,
# e.g. "skills": "json/base/meta/Power/Sorcerer/...". Left empty on purpose so
# the script never guesses paths that may have moved between data dumps.
FILES: dict[str, str] = {}

OUT = Path("backend/data/gamedata")


def main() -> int:
    if not FILES:
        print(
            "No mappings configured. Edit FILES with current d4data paths for "
            "skills/aspects/uniques/affixes, then re-run.",
            file=sys.stderr,
        )
        return 1
    OUT.mkdir(parents=True, exist_ok=True)
    with httpx.Client(timeout=30) as client:
        for category, path in FILES.items():
            url = f"{RAW_BASE}/{path}"
            resp = client.get(url)
            resp.raise_for_status()
            (OUT / f"{category}.json").write_bytes(resp.content)
            print(f"saved {category} <- {url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
