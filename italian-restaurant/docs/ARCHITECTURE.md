# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Pages   │ │Components│ │  3D Scene│ │   State (Zustand) │  │
│  │ (Routes) │ │ (UI/Feat)│ │(Three.js)│ │  (Auth/Cart/Theme)│  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │
│       │            │            │                  │             │
│  ┌────┴────────────┴────────────┴──────────────────┴──────────┐ │
│  │              Services (API, Cache, Offline, Prefetch)       │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Static Files │  │  API Proxy   │  │  WebSocket Upgrade    │  │
│  │  (client/dist)│  │ → server:3001│  │  → server:3001        │  │
│  └──────────────┘  └──────┬───────┘  └───────────┬───────────┘  │
└───────────────────────────┼──────────────────────┼──────────────┘
                            │                      │
                            ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Express + Socket.io)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Middleware Pipeline                       │  │
│  │  Security → Logger → RateLimit → IPBlacklist → Sanitizer   │  │
│  │  → JSON Parser → Auth(attachUser) → CSRF → AuditLog        │  │
│  └────────────────────────────┬───────────────────────────────┘  │
│                               │                                  │
│  ┌────────────┐ ┌────────────┐│┌────────────┐ ┌──────────────┐  │
│  │   Routes   │ │   Models   │││  Services  │ │   Config     │  │
│  │ (Handlers) │ │ (DB Access)│││ (Business) │ │ (DB/Env/Sec) │  │
│  └──────┬─────┘ └──────┬─────┘│└──────┬─────┘ └──────┬───────┘  │
│         │              │       │       │              │           │
│  ┌──────┴──────────────┴───────┴───────┴──────────────┴───────┐  │
│  │              Database Pool (pg) + Redis Cache               │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
┌─────────────────────┐  ┌─────────────────────┐
│   PostgreSQL 16     │  │      Redis 7        │
│  (Primary Storage)  │  │    (Cache Layer)    │
│                     │  │                     │
│  users              │  │  session cache      │
│  menu_items         │  │  rate-limit counters │
│  orders             │  │  token blacklist    │
│  order_items        │  │  menu cache         │
│  reservations       │  │                     │
│  reviews            │  │                     │
│  notifications      │  │                     │
│  audit_logs         │  │                     │
│  token_blacklist    │  │                     │
│  account_lockouts   │  │                     │
└─────────────────────┘  └─────────────────────┘
```

---

## Backend Architecture

### Layer Overview

```
┌──────────────────────────────────────┐
│           Route Handlers             │  ← Request/Response handling
├──────────────────────────────────────┤
│         Middleware Pipeline          │  ← Cross-cutting concerns
├──────────────────────────────────────┤
│            Models (DAL)              │  ← Data access, SQL queries
├──────────────────────────────────────┤
│           Services                   │  ← Business logic
├──────────────────────────────────────┤
│         Database Config              │  ← Connection pooling, transactions
└──────────────────────────────────────┘
```

### Middleware Pipeline

Requests flow through middleware in this order:

1. **Security** (`helmet`, `cors`) - HTTP security headers, CORS
2. **Logger** - Request logging in development
3. **Rate Limiter** - Request throttling per IP
4. **IP Blacklist** - Blocked IP rejection
5. **Request Size Limiter** - Body size limits
6. **Sanitizer** - Input sanitization (XSS prevention)
7. **JSON Parser** - Body parsing (`express.json`)
8. **Auth** (`attachUser`) - JWT token extraction and user attachment
9. **CSRF** - CSRF token validation (state-changing requests)
10. **Audit Logger** - Request/response logging for security

### Route Structure

| Route Group      | Prefix              | Auth Required | Admin Only |
|------------------|---------------------|---------------|------------|
| Auth             | `/api/auth`         | Varies        | No         |
| Menu             | `/api/menu`         | No (GET), Yes (POST/PUT/DELETE) | Yes (POST/PUT/DELETE) |
| Orders           | `/api/orders`       | Yes           | Varies     |
| Reservations     | `/api/reservations` | Yes           | Varies     |
| Reviews          | `/api/reviews`      | Yes (POST/PUT/DELETE) | No |
| Notifications    | `/api/notifications`| Yes           | No         |
| Upload           | `/api/upload`       | Yes           | Yes        |
| Security         | `/api/security`     | Yes           | Yes        |
| Webhooks         | `/api/webhooks`     | No (external) | No         |
| Health           | `/api/health`       | No            | No         |

### Models (Data Access Layer)

Each model follows a consistent pattern:

```typescript
export const ModelName = {
  async findById(id: string): Promise<Type | null> { ... },
  async findAll(filters: Filters): Promise<Type[]> { ... },
  async create(input: CreateInput): Promise<Type> { ... },
  async update(id: string, input: UpdateInput): Promise<Type | null> { ... },
  async delete(id: string): Promise<boolean> { ... },
}
```

Models use parameterized queries to prevent SQL injection.

### Transaction Support

```typescript
import { transaction } from "../config/database";

const result = await transaction(async (client) => {
  const order = await client.query("INSERT INTO orders ...");
  const items = await client.query("INSERT INTO order_items ...");
  return { order, items };
});
```

---

## Frontend Architecture

### Component Hierarchy

```
App
├── ThemeProvider (dark/light mode)
│   └── ToastProvider (notification toasts)
│       ├── Navbar
│       │   ├── Logo
│       │   ├── NavLinks
│       │   ├── CartIcon
│       │   ├── ThemeToggle
│       │   └── AuthButtons
│       ├── Routes
│       │   ├── HomePage → 3D Scene (Three.js)
│       │   ├── MenuPage → MenuFilter + MenuItem cards
│       │   ├── OrderPage → Cart + OrderForm
│       │   ├── CheckoutPage → PaymentForm
│       │   ├── OrderTrackingPage → OrderStatus timeline
│       │   ├── ReservationPage → ReservationForm
│       │   ├── ProfilePage → User info + Order history
│       │   ├── AboutPage → Restaurant info
│       │   └── ContactPage → Contact form
│       └── Footer
```

### State Management

| Context      | Purpose                            | Persistence  |
|--------------|------------------------------------|--------------|
| AuthContext   | User auth state, JWT token         | localStorage |
| CartContext   | Shopping cart items, totals        | localStorage |
| ThemeContext  | Dark/light mode preference         | localStorage |
| CacheContext  | API response cache configuration   | sessionStorage|

### Routing

| Path                    | Page                | Auth Required |
|-------------------------|---------------------|---------------|
| `/`                     | HomePage            | No            |
| `/menu`                 | MenuPage            | No            |
| `/order`                | OrderPage           | Yes           |
| `/checkout`             | CheckoutPage        | Yes           |
| `/order-tracking/:id`   | OrderTrackingPage   | Yes           |
| `/profile`              | ProfilePage         | Yes           |
| `/reservation`          | ReservationPage     | Yes           |
| `/about`                | AboutPage           | No            |
| `/contact`              | ContactPage         | No            |

### Custom Hooks

| Hook                     | Purpose                                  |
|--------------------------|------------------------------------------|
| `useAnnounce`            | Screen reader announcements (a11y)       |
| `useCache`               | API response caching with TTL            |
| `useDebounce`            | Debounced input values                   |
| `useIntersectionObserver`| Lazy loading / infinite scroll           |
| `useKeyboardNavigation`  | Keyboard event handling                  |
| `useLazyLoad`            | Deferred component rendering             |
| `useOffline`             | Online/offline status detection          |
| `usePrefetch`            | Route prefetching on hover               |
| `useReducedMotion`       | Reduced motion preference detection      |
| `useThrottle`            | Throttled event handlers                 |
| `useVirtualScroll`       | Virtualized list rendering               |

### 3D Scene (Three.js)

The homepage features an interactive 3D Italian restaurant scene:

| Component                | Description                          |
|--------------------------|--------------------------------------|
| `RestaurantScene`        | Main scene composition               |
| `Background`             | Gradient background with lighting    |
| `PizzaModel`             | 3D pizza model                       |
| `WineBottle`             | 3D wine bottle model                 |
| `FloatingIngredients`    | Animated floating ingredient objects |

### Services Layer

| Service            | Purpose                                  |
|--------------------|------------------------------------------|
| `api.ts`           | Axios HTTP client with interceptors      |
| `cacheService.ts`  | In-memory cache with TTL                 |
| `imageCache.ts`    | Image caching with IndexedDB             |
| `offlineManager.ts`| Offline queue and sync                   |
| `prefetcher.ts`    | Route/component prefetching              |

---

## Database Schema

### Entity Relationship Diagram

```
users ─────────────┐
  │                │
  ├────────────────┤
  │                │
  ▼                ▼
orders          reservations
  │
  ▼
order_items ──► menu_items
                  │
                  ▼
               reviews ◄── users
                  │
                  ▼
              notifications
                  │
                  ▼
              audit_logs
```

### Table Summary

| Table              | Purpose                              |
|--------------------|--------------------------------------|
| `users`            | User accounts and profiles           |
| `menu_items`       | Restaurant menu with categories      |
| `orders`           | Customer orders                      |
| `order_items`      | Individual items within an order     |
| `reservations`     | Table reservations                   |
| `reviews`          | Customer reviews and ratings         |
| `notifications`    | User notification messages           |
| `audit_logs`       | Security audit trail                 |
| `token_blacklist`  | Revoked JWT tokens                   |
| `account_lockouts` | Account lockout tracking             |

### Key Indexes

- **users**: unique on `email`, index on `role`, partial index on `is_active`
- **menu_items**: index on `category`, partial on `is_available`, `is_featured`
- **orders**: index on `user_id`, `status`, `created_at DESC`
- **order_items**: index on `order_id`, `menu_item_id`
- **reservations**: unique on `confirmation_code`, index on `date`, `status`
- **reviews**: index on `menu_item_id`, `rating`, partial on `is_approved`

### Auto-Updated Timestamps

All tables have `created_at` and `updated_at` columns with triggers that automatically update `updated_at` on row modification.

---

## Cache Strategy

### Redis Usage

| Key Pattern           | TTL    | Purpose                        |
|-----------------------|--------|--------------------------------|
| `menu:items`          | 5 min  | Cached menu items              |
| `menu:featured`       | 5 min  | Featured items                 |
| `menu:categories`     | 10 min | Category counts                |
| `ratelimit:*`         | 15 min | Rate limit counters            |
| `blacklist:*`         | 24 hr  | IP blacklist                   |

### Client-Side Caching

- **API responses**: In-memory cache with configurable TTL via `useCache` hook
- **Images**: IndexedDB-based image cache for offline support
- **Static assets**: Nginx cache headers (1 year immutable for hashed assets)
- **Service worker**: Precaching of static assets for offline access

---

## WebSocket Events

### Connection Flow

1. Client connects to Socket.io server
2. JWT token extracted from handshake auth
3. User authenticated and joined to personal room
4. Admin users join `admin:dashboard` room

### Room Structure

| Room                  | Purpose                          |
|-----------------------|----------------------------------|
| `user:{userId}`       | Per-user notifications           |
| `order:{orderId}`     | Order tracking updates           |
| `admin:dashboard`     | Admin real-time dashboard        |
| `kitchen:display`     | Kitchen order display            |

### Event Flow: Order Status Update

```
Admin updates status
    │
    ├──► orderTrackingService.updateOrderStatus()
    │        │
    │        ├──► Database: UPDATE orders SET status = ...
    │        ├──► emitToOrder() → Customer sees update
    │        ├──► emitToAdmins() → Admin dashboard updates
    │        └──► emitToKitchen() → Kitchen display updates
    │
    └──► notificationService.sendOrderUpdate()
             │
             └──► Email notification to customer
```

---

## Security Layers

### Layer 1: Transport Security
- HTTPS/TLS in production (via Nginx)
- HSTS headers with 1-year max-age

### Layer 2: HTTP Security Headers
- `helmet()` middleware sets:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - Content Security Policy directives

### Layer 3: Rate Limiting
- General: 100 requests/15 min per IP
- Auth: 5 requests/15 min per IP
- Orders: 30 requests/15 min per IP
- Reservations: 20 requests/15 min per IP

### Layer 4: IP Blacklisting
- Auto-ban after 10 failed attempts within 5 minutes
- Manual ban via admin API
- Stored in memory with TTL

### Layer 5: Input Validation
- Zod schema validation on all endpoints
- `sanitize-html` for XSS prevention
- Parameterized SQL queries (no string interpolation)

### Layer 6: Authentication & Authorization
- JWT with short-lived access tokens (1 hour)
- Refresh token rotation
- Token blacklist on logout/password change
- Role-based access control (customer, admin)
- Account lockout after 5 failed attempts

### Layer 7: CSRF Protection
- CSRF token endpoint (`/api/csrf-token`)
- Token validation on state-changing requests

### Layer 8: Audit Logging
- All API requests logged with timestamp, method, path, IP, user ID
- Security events logged (failed logins, bans, etc.)

---

## Performance Optimizations

### Backend
- **Connection pooling**: PostgreSQL pool with max 20 connections
- **Database indexing**: Strategic indexes on frequently queried columns
- **Soft deletes**: Menu items use `is_deleted` flag instead of hard deletes
- **Transaction batching**: Order creation uses single transaction

### Frontend
- **Code splitting**: Vite automatic chunking
- **Lazy loading**: Route-level lazy loading via `React.lazy`
- **Virtual scrolling**: For large lists (`useVirtualScroll` hook)
- **Debounced inputs**: Search and filter inputs debounced
- **Image optimization**: Lazy loading with intersection observer
- **Prefetching**: Route prefetching on navigation hover
- **Service worker**: Static asset caching for offline support

### Infrastructure
- **Nginx**: Gzip compression, static asset caching, proxy buffering
- **Docker multi-stage builds**: Minimal production images
- **Redis caching**: Reduces database load for frequent queries
- **Health checks**: Automatic container restart on failure
