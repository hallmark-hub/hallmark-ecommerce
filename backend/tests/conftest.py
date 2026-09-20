import os


os.environ["APP_ENV"] = "test"

for key in [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PAYSTACK_SECRET_KEY",
    "PAYSTACK_PUBLIC_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
]:
    os.environ[key] = ""


import pytest


@pytest.fixture(autouse=True)
def test_product_catalog():
    """Provide product fixtures only inside tests, never in application code."""
    from app.models.catalog import CheckoutType
    from app.services.catalog_service import _PRODUCT_DATA

    _PRODUCT_DATA[:] = [
        {
            "id": "10000000-0000-4000-8000-000000000001",
            "name": "Test Direct Product",
            "slug": "test-direct-product",
            "description": "Test-only direct checkout fixture.",
            "category_id": "00000000-0000-4000-8000-000000000001",
            "category_slug": "chef-uniforms",
            "checkout_type": CheckoutType.direct,
            "price_pesewas": 15000,
            "price_label": None,
            "images": ["https://example.com/test-direct-product.jpg"],
            "in_stock": True,
            "stock_qty": 50,
            "tags": ["test"],
            "created_at": "2026-05-25T00:00:00Z",
        },
        {
            "id": "10000000-0000-4000-8000-000000000003",
            "name": "Test Quote Product",
            "slug": "test-quote-product",
            "description": "Test-only quote fixture.",
            "category_id": "00000000-0000-4000-8000-000000000004",
            "category_slug": "kitchen-setup",
            "checkout_type": CheckoutType.quote,
            "price_pesewas": None,
            "price_label": "Request a quote",
            "images": ["https://example.com/test-quote-product.jpg"],
            "in_stock": True,
            "stock_qty": 1,
            "tags": ["test"],
            "created_at": "2026-05-25T00:00:00Z",
        },
    ]
    yield
    _PRODUCT_DATA.clear()


@pytest.fixture
def admin_auth():
    """Authenticate admin route tests as an admin.

    require_admin itself is covered directly in test_admin_auth.py; route tests
    override it so they exercise the handlers rather than Supabase Auth.
    """
    from app.core.admin_auth import require_admin
    from app.main import app

    app.dependency_overrides[require_admin] = lambda: None
    yield
    app.dependency_overrides.pop(require_admin, None)
