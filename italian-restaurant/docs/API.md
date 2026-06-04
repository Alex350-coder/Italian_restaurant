# API Documentation

## Base URL

```
Development:  http://localhost:3001/api
Production:   https://your-domain.com/api
```

## Authentication

The API uses **JWT Bearer tokens** for authentication.

### Obtaining a Token

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!","name":"John Doe"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'
```

### Using the Token

Include the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Token Lifecycle

- **Access Token**: expires in 1 hour (configurable via `JWT_EXPIRES_IN`)
- **Refresh Token**: expires in 7 days
- Tokens are invalidated on password change

---

## Rate Limits

| Endpoint Group   | Window  | Max Requests |
|------------------|---------|--------------|
| General          | 15 min  | 100          |
| Authentication   | 15 min  | 5            |
| Orders           | 15 min  | 30           |
| Reservations     | 15 min  | 20           |

Rate limit headers are included in responses:
- `RateLimit-Limit`
- `RateLimit-Remaining`
- `RateLimit-Reset`

---

## Response Format

All endpoints return JSON in the standard envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

On error:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

---

## Auth Endpoints

### POST /api/auth/register

Register a new customer account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Pass123!",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

| Field      | Type   | Required | Constraints                          |
|------------|--------|----------|--------------------------------------|
| email      | string | yes      | Valid email, max 254 chars           |
| password   | string | yes      | 8-128 chars, upper+lower+digit+special |
| name       | string | yes      | 2-100 characters                     |
| phone      | string | no       | Valid phone format                   |

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "role": "customer",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

**Errors:**

| Code | Description              |
|------|--------------------------|
| 400  | Validation failed        |
| 409  | Email already registered |

---

### POST /api/auth/login

Authenticate and receive a JWT token.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "Pass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    },
    "token": "jwt-token"
  }
}
```

**Errors:**

| Code | Description                          |
|------|--------------------------------------|
| 401  | Invalid email or password            |
| 429  | Too many login attempts              |

---

### GET /api/auth/me

Get the current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    }
  }
}
```

---

### POST /api/auth/refresh

Refresh the JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token"
  }
}
```

---

### POST /api/auth/forgot-password

Request a password reset link.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

Always returns success to prevent email enumeration:

```json
{
  "success": true,
  "data": {
    "message": "If an account exists, a reset link has been sent"
  }
}
```

---

### POST /api/auth/reset-password

Reset password using the token from email.

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewPass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  }
}
```

---

## Menu Endpoints

### GET /api/menu

Get all menu items with optional category filter.

**Query Parameters:**

| Parameter  | Type   | Description                |
|------------|--------|----------------------------|
| category   | string | Filter by category         |

**Categories:** `appetizers`, `pasta`, `pizza`, `risotto`, `meat`, `seafood`, `salads`, `desserts`, `beverages`, `wine`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Margherita Pizza",
        "description": "Classic tomato, mozzarella, basil",
        "price": 12.99,
        "category": "pizza",
        "image_url": "/uploads/pizza.jpg",
        "is_available": true,
        "is_deleted": false,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/menu/featured

Get featured menu items (up to 5).

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [...]
  }
}
```

---

### GET /api/menu/categories

Get all categories with item counts.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "categories": [
      { "name": "pizza", "count": 8 },
      { "name": "pasta", "count": 6 }
    ]
  }
}
```

---

### GET /api/menu/:id

Get a single menu item by ID.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "item": { ... }
  }
}
```

---

### POST /api/menu

**Admin only.** Create a new menu item.

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**

```json
{
  "name": "Tiramisu",
  "description": "Classic Italian dessert",
  "price": 8.99,
  "category": "desserts",
  "image_url": "https://example.com/tiramisu.jpg",
  "is_available": true
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "item": { ... }
  }
}
```

---

### PUT /api/menu/:id

**Admin only.** Update a menu item.

**Request Body:** Same as POST.

**Response (200):** Updated item.

---

### DELETE /api/menu/:id

**Admin only.** Soft-delete a menu item.

**Response (200):**

```json
{
  "success": true,
  "data": { "message": "Menu item deleted" }
}
```

---

## Order Endpoints

### GET /api/orders

Get orders for the authenticated user. Admins see all orders.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "status": "confirmed",
        "total": 25.98,
        "notes": "No onions please",
        "created_at": "2024-01-01T00:00:00.000Z",
        "items": [
          {
            "id": "uuid",
            "order_id": "uuid",
            "menu_item_id": "uuid",
            "quantity": 2,
            "unit_price": 12.99,
            "subtotal": 25.98
          }
        ]
      }
    ]
  }
}
```

---

### GET /api/orders/stats

**Admin only.** Get order statistics.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": 4523.50,
    "ordersByStatus": [
      { "status": "pending", "count": 5 },
      { "status": "confirmed", "count": 12 }
    ],
    "popularItems": [
      { "name": "Margherita Pizza", "totalQuantity": 89, "totalRevenue": 1156.11 }
    ],
    "recentOrders": [...]
  }
}
```

---

### GET /api/orders/:id

Get a single order by ID. Users can only access their own orders.

**Response (200):** Order with items.

---

### POST /api/orders

Create a new order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "items": [
    { "menu_item_id": "uuid", "quantity": 2 },
    { "menu_item_id": "uuid", "quantity": 1 }
  ],
  "notes": "Extra cheese on the pizza"
}
```

| Field            | Type   | Required | Constraints              |
|------------------|--------|----------|--------------------------|
| items            | array  | yes      | Min 1 item               |
| items[].menu_item_id | string | yes | Valid UUID              |
| items[].quantity | number | yes      | Positive integer         |
| notes            | string | no       | Max 500 characters       |

**Response (201):** Created order with items and calculated total.

---

### PUT /api/orders/:id/status

**Admin only.** Update order status.

**Request Body:**

```json
{
  "status": "preparing"
}
```

**Valid statuses:** `pending`, `confirmed`, `preparing`, `ready`, `delivered`, `cancelled`

**Response (200):** Updated order.

---

### POST /api/orders/:id/pay

Process payment for an order via Stripe.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "paymentMethod": "card",
  "cardToken": "tok_visa"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "pi_xxx",
      "status": "succeeded",
      "amount": 2598
    },
    "order": {
      "id": "uuid",
      "status": "confirmed"
    }
  }
}
```

---

### POST /api/orders/:id/cancel

Cancel an order.

**Headers:** `Authorization: Bearer <token>`

**Response (200):** Updated order with `cancelled` status.

---

## Reservation Endpoints

### GET /api/reservations

Get reservations for the authenticated user. Admins see all.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "reservation_date": "2024-06-15",
        "reservation_time": "19:00",
        "party_size": 4,
        "status": "confirmed",
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "user@example.com"
      }
    ]
  }
}
```

---

### GET /api/reservations/today

**Admin only.** Get today's reservations with stats.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reservations": [...],
    "stats": {
      "date": "2024-06-15",
      "total": 12,
      "byStatus": [
        { "status": "confirmed", "count": 8, "totalGuests": 24 }
      ]
    }
  }
}
```

---

### GET /api/reservations/availability

Check available time slots for a given date.

**Query Parameters:**

| Parameter | Type   | Required | Format    |
|-----------|--------|----------|-----------|
| date      | string | yes      | YYYY-MM-DD |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "slots": [
      { "time": "12:00", "isAvailable": true, "maxPartySize": 8 },
      { "time": "12:30", "isAvailable": false, "maxPartySize": 0 }
    ]
  }
}
```

---

### POST /api/reservations

Create a new reservation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "reservation_date": "2024-06-15",
  "reservation_time": "19:00",
  "party_size": 4,
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "user@example.com",
  "notes": "Birthday celebration, need a cake"
}
```

| Field            | Type   | Required | Constraints                         |
|------------------|--------|----------|-------------------------------------|
| reservation_date | string | yes      | YYYY-MM-DD, today or future         |
| reservation_time | string | yes      | HH:MM format                        |
| party_size       | number | yes      | 1-20                                 |
| name             | string | yes      | Max 100 characters                   |
| phone            | string | yes      | Valid phone format                   |
| email            | string | yes      | Valid email                          |
| notes            | string | no       | Max 500 characters                   |

**Response (201):** Created reservation.

---

### PUT /api/reservations/:id/confirm

**Admin only.** Confirm a reservation.

**Response (200):** Updated reservation with `confirmed` status.

---

### PUT /api/reservations/:id/cancel

Cancel a reservation. Users can cancel their own; admins can cancel any.

**Response (200):** Updated reservation with `cancelled` status.

---

## Review Endpoints

### GET /api/reviews

Get reviews filtered by menu item or user.

**Query Parameters:**

| Parameter    | Type   | Required |
|--------------|--------|----------|
| menu_item_id | string | yes*     |
| user_id      | string | yes*     |

*At least one parameter is required.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "menu_item_id": "uuid",
        "rating": 5,
        "comment": "Amazing pizza!",
        "user_name": "John Doe",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/reviews/:id

Get a single review by ID.

---

### GET /api/reviews/:menuItemId/stats

Get average rating and count for a menu item.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "average": 4.5,
    "count": 24
  }
}
```

---

### POST /api/reviews

Create a review for a menu item.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "menu_item_id": "uuid",
  "rating": 5,
  "comment": "Delicious!"
}
```

| Field        | Type   | Required | Constraints              |
|--------------|--------|----------|--------------------------|
| menu_item_id | string | yes      | Valid UUID               |
| rating       | number | yes      | Integer 1-5              |
| comment      | string | no       | Max 1000 characters      |

**Response (201):** Created review.

**Errors:**

| Code | Description                                    |
|------|------------------------------------------------|
| 409  | You have already reviewed this item            |

---

### PUT /api/reviews/:id

Update your own review.

**Request Body:** `rating` (required), `comment` (optional).

---

### DELETE /api/reviews/:id

Delete your own review. Admins can delete any review.

---

## Notification Endpoints

### GET /api/notifications

Get notifications for the authenticated user.

**Query Parameters:**

| Parameter | Type    | Description            |
|-----------|---------|------------------------|
| unread    | boolean | Filter to unread only  |

---

### GET /api/notifications/unread-count

Get count of unread notifications.

**Response (200):**

```json
{
  "success": true,
  "data": { "count": 3 }
}
```

---

### PUT /api/notifications/:id/read

Mark a notification as read.

---

### PUT /api/notifications/read-all

Mark all notifications as read.

**Response (200):**

```json
{
  "success": true,
  "data": { "updatedCount": 5 }
}
```

---

### DELETE /api/notifications/:id

Delete a notification.

---

## Upload Endpoints

### POST /api/upload

**Admin only.** Upload a single image.

**Request:** `multipart/form-data` with field `image`.

**Constraints:**
- Max file size: 5MB
- Allowed types: JPEG, PNG, GIF, WEBP

**Response (201):**

```json
{
  "success": true,
  "data": {
    "url": "/uploads/1704067200000-123456789.jpg",
    "filename": "1704067200000-123456789.jpg",
    "originalName": "pizza.jpg",
    "size": 1048576,
    "mimetype": "image/jpeg"
  }
}
```

---

### POST /api/upload/multiple

**Admin only.** Upload multiple images (max 10).

**Request:** `multipart/form-data` with field `images`.

---

### DELETE /api/upload/:filename

**Admin only.** Delete an uploaded file.

---

## Security Endpoints

All security endpoints require admin role.

### GET /api/security/audit-logs

Get audit logs with pagination.

---

### GET /api/security/audit-logs/stats

Get audit log statistics.

---

### GET /api/security/blacklist

Get list of blacklisted IPs.

---

### POST /api/security/blacklist

Ban an IP address.

**Request Body:**

```json
{
  "ip": "192.168.1.100",
  "reason": "Suspicious activity"
}
```

---

### DELETE /api/security/blacklist/:ip

Unban an IP address.

---

### GET /api/security/stats

Get security statistics (failed attempts, audit stats).

---

## WebSocket Events

Connect to the Socket.io server at the same base URL.

### Client Events (emit)

| Event          | Payload            | Description                   |
|----------------|--------------------|-------------------------------|
| `join:order`   | `orderId: string`  | Join order tracking room      |
| `leave:order`  | `orderId: string`  | Leave order tracking room     |
| `join:kitchen` | (none)             | Join kitchen display (admin)  |
| `leave:kitchen`| (none)             | Leave kitchen display         |

### Server Events (listen)

| Event                   | Description                              |
|-------------------------|------------------------------------------|
| `order:status`          | Order status updated                     |
| `order:updated`         | Order updated (admin broadcast)          |
| `reservation:new`       | New reservation created (admin)          |
| `reservation:confirmed` | Reservation confirmed (user)             |
| `reservation:cancelled` | Reservation cancelled (user/admin)       |
| `reservation:updated`   | Reservation status changed (admin)       |
| `kitchen:order-update`  | Order update for kitchen display         |
| `server:shutdown`       | Server shutting down                     |

---

## Webhook Endpoints

### POST /api/webhooks/stripe

Stripe payment webhook. Verifies Stripe signature and processes:

- `payment_intent.succeeded` - Confirms order
- `payment_intent.payment_failed` - Notifies user
- `charge.refunded` - Logs refund

### POST /api/webhooks/order-status

Internal webhook for order status updates from external systems.

---

## Health Check

### GET /api/health

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```
