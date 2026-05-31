from __future__ import annotations


def test_current_patch_returns_configured_value(client):
    res = client.get("/api/meta/current-patch")
    assert res.status_code == 200
    body = res.json()
    assert "patch" in body
    assert isinstance(body["patch"], str)
    assert body["patch"]  # não-vazio (default "3.0")
