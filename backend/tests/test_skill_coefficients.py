from app import skill_coefficients as sc


def test_load_returns_catalog():
    cat = sc.load()
    assert cat.patch
    assert isinstance(cat.skills, list) and len(cat.skills) >= 1


def test_get_known_skill():
    skill = sc.get("barbarian_hota")
    assert skill is not None
    assert skill.name == "Hammer of the Ancients"
    assert skill.class_name == "Barbarian"


def test_get_unknown_skill_is_none():
    assert sc.get("does_not_exist") is None


def test_coefficient_at_linear_scaling():
    # base 0.60, +0.06/rank  ->  rank1=0.60, rank3=0.72, rank5=0.84
    assert sc.coefficient_at("barbarian_hota", 1) == 0.60
    assert round(sc.coefficient_at("barbarian_hota", 3), 4) == 0.72
    assert round(sc.coefficient_at("barbarian_hota", 5), 4) == 0.84


def test_coefficient_at_clamps_rank():
    # rank above the max clamps to `ranks`; below 1 clamps to 1
    assert sc.coefficient_at("barbarian_hota", 99) == sc.coefficient_at("barbarian_hota", 5)
    assert sc.coefficient_at("barbarian_hota", 0) == sc.coefficient_at("barbarian_hota", 1)


def test_coefficient_at_unknown_is_none():
    assert sc.coefficient_at("does_not_exist", 1) is None


def test_list_skills_returns_all():
    skills = sc.list_skills()
    assert isinstance(skills, list)
    assert {s.id for s in skills} >= {"barbarian_hota"}


def test_skill_icon_url_defaults_none():
    from app.skill_coefficients import Coefficient, Skill
    s = Skill(id="x", name="X", class_name="Barbarian", coefficient=Coefficient(base=0.5))
    assert s.icon_url is None
