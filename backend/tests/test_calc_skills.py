def test_skills_catalog(client):
    res = client.get("/api/calc/skills")
    assert res.status_code == 200
    body = res.json()
    assert "patch" in body and "skills" in body
    ids = [s["id"] for s in body["skills"]]
    assert "barbarian_hota" in ids


def test_damage_resolves_base_from_skill(client):
    # base_hit = weapon_damage * coef(rank). hota rank1 coef = 0.60
    # weapon_damage 1000 -> base_hit 600. Sem modifiers/crit/vuln/op => dps = 600 * hits.
    res = client.post("/api/calc/damage", json={
        "skill_id": "barbarian_hota", "skill_rank": 1, "weapon_damage": 1000,
        "hits_per_second": 1,
    })
    assert res.status_code == 200
    body = res.json()
    assert body["base_hit"] == 600.0
    assert body["resolved"] is not None
    assert body["resolved"]["coefficient"] == 0.60
    assert body["resolved"]["name"] == "Hammer of the Ancients"


def test_damage_manual_path_unchanged(client):
    # Sem campos de skill: usa base_hit do corpo (regressão do contrato atual).
    res = client.post("/api/calc/damage", json={"base_hit": 10000, "hits_per_second": 2})
    assert res.status_code == 200
    body = res.json()
    assert body["base_hit"] == 10000
    assert body["expected_dps"] == 20000
    assert body["resolved"] is None


def test_damage_unknown_skill_falls_back_to_manual(client):
    res = client.post("/api/calc/damage", json={
        "skill_id": "nope", "weapon_damage": 1000, "base_hit": 500, "hits_per_second": 1,
    })
    assert res.status_code == 200
    body = res.json()
    assert body["base_hit"] == 500  # caiu no manual
    assert body["resolved"] is None


def test_damage_requires_base_or_skill(client):
    res = client.post("/api/calc/damage", json={"hits_per_second": 1})
    assert res.status_code == 422
