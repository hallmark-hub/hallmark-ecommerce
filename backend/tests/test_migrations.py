from pathlib import Path


MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "migrations"


def test_migration_files_are_numbered_in_apply_order() -> None:
    migration_files = sorted(
        path.name for path in MIGRATIONS_DIR.glob("*.sql")
    )

    assert migration_files == [
        "001_initial_schema.sql",
        "002_seed_categories.sql",
        "003_seed_sample_products.sql",
    ]


def test_initial_schema_contains_contract_tables_and_constraints() -> None:
    schema = (MIGRATIONS_DIR / "001_initial_schema.sql").read_text()

    for table_name in [
        "categories",
        "products",
        "orders",
        "order_items",
        "quote_requests",
        "quote_request_products",
        "payments",
        "payment_events",
    ]:
        assert f"create table if not exists {table_name}" in schema

    assert "orders_phone_ghana" in schema
    assert "orders_returns_policy_accepted" in schema
    assert "products_direct_price_required" in schema


def test_category_seed_matches_api_contract_slugs() -> None:
    seed = (MIGRATIONS_DIR / "002_seed_categories.sql").read_text()

    for slug in [
        "chef-uniforms",
        "staff-uniforms-branding",
        "kitchen-equipment-tools",
        "kitchen-setup",
        "machine-preorders",
        "machine-customization",
        "embroidery",
        "logo-printing-branding",
    ]:
        assert slug in seed

    assert "on conflict (slug) do update" in seed
