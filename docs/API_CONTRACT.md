# API Contract — ChefWare Enterprise

**Version:** v1  
**Base URL:** `https://api.chefware.com/api/v1` (prod) | `http://localhost:8000/api/v1` (local)  
**Last updated:** 2026-05-25  

---

## Standard Response Envelope

Every endpoint returns this shape:

```json
{
  "success": true,
  "data": {},
  "message": "Human-readable status string"
}
```

On error:
```json
{
  "success": false,
  "data": null,
  "message": "What went wrong"
}
```

---

## Prices

All prices are stored and returned as **integers in pesewas** (1 GHS = 100 pesewas).  
Display layer formats: `GHS 250.00` = `25000` pesewas.

---

## Phone Numbers

All phone fields must be `+233XXXXXXXXX` format.

---

## Checkout Types

| Value | Meaning |
|---|---|
| `direct` | Normal add-to-cart → checkout flow |
| `quote` | "Request a Quote" form only — no cart |

---

## Endpoints

### Health

#### `GET /health`

```json
{
  "success": true,
  "data": { "status": "ok" },
  "message": "Service is running"
}
```

---

### Categories

#### `GET /api/v1/categories`

Returns all product categories.

**Response `data`:**
```json
[
  {
    "id": "uuid",
    "name": "Chef Uniforms",
    "slug": "chef-uniforms",
    "description": "Premium chef jackets, trousers, aprons, hats, and complete kitchen attire.",
    "checkout_type": "direct",
    "image_url": "https://res.cloudinary.com/..."
  }
]
```

**Seeded categories:**

| name | slug | checkout_type |
|---|---|---|
| Chef Uniforms | `chef-uniforms` | `direct` |
| Restaurant Staff Uniforms & Branding | `staff-uniforms-branding` | `direct` |
| Industrial Kitchen Equipment & Tools | `kitchen-equipment-tools` | `direct` |
| Industrial Kitchen Setup | `kitchen-setup` | `quote` |
| Customized Machine Pre-Orders | `machine-preorders` | `quote` |
| Machine Customization | `machine-customization` | `quote` |
| Embroidery Services | `embroidery` | `quote` |
| Logo Printing & Garment Branding | `logo-printing-branding` | `quote` |

---

### Products

#### `GET /api/v1/products`

**Query params:**

| param | type | default | notes |
|---|---|---|---|
| `category` | string | — | filter by category slug |
| `search` | string | — | full-text search on name/description |
| `in_stock` | bool | — | filter by stock availability |
| `page` | int | `1` | |
| `limit` | int | `20` | max `100` |

**Response `data`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Classic White Chef Jacket",
      "slug": "classic-white-chef-jacket",
      "description": "Premium cotton chef jacket...",
      "category_id": "uuid",
      "category_slug": "chef-uniforms",
      "checkout_type": "direct",
      "price_pesewas": 15000,
      "images": ["https://res.cloudinary.com/...", "..."],
      "in_stock": true,
      "stock_qty": 50,
      "tags": ["jacket", "uniform"],
      "created_at": "2026-05-25T00:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

#### `GET /api/v1/products/{slug}`

Returns a single product by slug.

**Response `data`:** same shape as a single item from the list above.

**Error (404):**
```json
{ "success": false, "data": null, "message": "Product not found" }
```

---

### Quote Requests

#### `POST /api/v1/quote-requests`

Used for `checkout_type: quote` categories.

**Request body:**
```json
{
  "name": "Kwame Asante",
  "email": "kwame@example.com",
  "phone": "+233244123456",
  "category_slug": "kitchen-setup",
  "message": "We need a full kitchen setup for a 60-seat restaurant.",
  "product_ids": ["uuid", "uuid"]
}
```

**Response `data`:**
```json
{
  "id": "uuid",
  "reference": "QR-20260525-0001",
  "status": "received"
}
```

> Backend sends SMS notification to admin via Africa's Talking on receipt.

---

### Orders

#### `POST /api/v1/orders`

Creates an order. Call this before initializing payment.

**Request body:**
```json
{
  "customer": {
    "name": "Ama Boateng",
    "email": "ama@example.com",
    "phone": "+233201987654"
  },
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ],
  "payment_method": "paystack"
}
```

`payment_method` values: `paystack` | `bank_transfer`

**Response `data`:**
```json
{
  "id": "uuid",
  "reference": "CW-20260525-0042",
  "subtotal_pesewas": 30000,
  "total_pesewas": 30000,
  "payment_method": "paystack",
  "payment_status": "pending",
  "order_status": "pending",
  "created_at": "2026-05-25T10:00:00Z"
}
```

#### `GET /api/v1/orders/{order_id}`

Order status lookup (used by chatbot + customer order tracking).

**Response `data`:**
```json
{
  "id": "uuid",
  "reference": "CW-20260525-0042",
  "customer": {
    "name": "Ama Boateng",
    "phone": "+233201987654"
  },
  "items": [
    {
      "product_name": "Classic White Chef Jacket",
      "quantity": 2,
      "unit_price_pesewas": 15000
    }
  ],
  "total_pesewas": 30000,
  "payment_method": "paystack",
  "payment_status": "pending",
  "order_status": "pending",
  "created_at": "2026-05-25T10:00:00Z"
}
```

`order_status` values: `pending` | `confirmed` | `delivered`  
`payment_status` values: `pending` | `paid` | `failed`

---

### Payments

#### `POST /api/v1/payments/paystack/initialize`

Initializes a Paystack transaction after order creation.

**Request body:**
```json
{
  "order_id": "uuid"
}
```

**Response `data`:**
```json
{
  "authorization_url": "https://checkout.paystack.com/abc123",
  "access_code": "abc123",
  "reference": "CW-20260525-0042"
}
```

> Frontend redirects customer to `authorization_url`.

#### `POST /api/v1/payments/paystack/webhook`

Paystack calls this after payment. Backend validates signature, updates order.  
**Frontend never calls this directly.**

#### `GET /api/v1/payments/paystack/verify/{reference}`

Frontend calls this after customer returns from Paystack checkout to confirm payment status.

**Response `data`:**
```json
{
  "reference": "CW-20260525-0042",
  "payment_status": "paid",
  "order_id": "uuid"
}
```

#### `POST /api/v1/payments/bank-transfer`

Returns bank details and unique reference for manual transfer.

**Request body:**
```json
{
  "order_id": "uuid",
  "bank": "gcb"
}
```

`bank` values: `gcb` | `stanbic`

**Response `data`:**
```json
{
  "reference": "CW-20260525-0042",
  "bank_name": "GCB Bank",
  "branch": "Nima",
  "account_name": "Chefware Enterprises",
  "account_number": "1481180001715",
  "amount_pesewas": 30000,
  "instructions": "Transfer exactly GHS 300.00 and use reference CW-20260525-0042 as payment narration."
}
```

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Created |
| `400` | Bad request / validation error |
| `404` | Resource not found |
| `422` | Unprocessable entity (Pydantic validation) |
| `500` | Internal server error |

---

## Frontend Mock Strategy

Until the backend is live, the `frontend/src/api/` layer returns hardcoded responses matching the shapes above. Swap is a one-line base URL change per service file.

Suggested mock files:
- `frontend/src/api/products.js`
- `frontend/src/api/orders.js`
- `frontend/src/api/payments.js`
- `frontend/src/api/quotes.js`
