from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client() -> TestClient:
    with TestClient(app) as c:
        yield c


def test_current_patch_returns_configured_value(client):
    res = client.get("/api/meta/current-patch")
    assert res.status_code == 200
    body = res.json()
    assert "patch" in body
    assert isinstance(body["patch"], str)
    assert body["patch"]  # não-vazio (default "3.0")
