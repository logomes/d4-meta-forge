"""Source ingestion — links + metadata only, never guide bodies.

Respects robots.txt for our user-agent and prefers official feeds. Turning a
fetched feed into SourceRef rows is intentionally left as the integration
point (parse each publisher's RSS/sitemap as permitted).
"""
from __future__ import annotations

import urllib.robotparser as robotparser
from urllib.parse import urlparse

import httpx

from .config import settings

# Curated source roots. Add publisher RSS/sitemap URLs here as discovered.
SOURCE_FEEDS: dict[str, str] = {
    "blizzard-patch": "https://news.blizzard.com/en-us/diablo4",
    "maxroll-news": "https://maxroll.gg/d4/news",
}


def is_allowed(url: str) -> bool:
    parsed = urlparse(url)
    parser = robotparser.RobotFileParser()
    parser.set_url(f"{parsed.scheme}://{parsed.netloc}/robots.txt")
    try:
        parser.read()
    except Exception:
        return False
    return parser.can_fetch(settings.user_agent, url)


async def fetch_if_allowed(url: str) -> str | None:
    """Return page text only if robots.txt permits our agent, else None."""
    if not is_allowed(url):
        return None
    async with httpx.AsyncClient(
        headers={"User-Agent": settings.user_agent}, timeout=15
    ) as client:
        resp = await client.get(url, follow_redirects=True)
        resp.raise_for_status()
        return resp.text
