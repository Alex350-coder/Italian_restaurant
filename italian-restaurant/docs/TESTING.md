# Testing Guide

## Test Structure

```
tests/
├── unit/                    # Isolated function/method tests
│   ├── auth.test.ts
│   ├── cache.test.ts
│   ├── emailService.test.ts
│   ├── errorHandler.test.ts
│   ├── menuItem.test.ts
│   ├── order.test.ts
│   ├── reservation.test.ts
│   ├── reviews.test.ts
│   ├── seed.test.ts
│   ├── stripeService.test.ts
│   ├── user.test.ts
│   └── validation.test.ts
├── integration/             # API endpoint tests (supertest)
│   ├── auth.integration.test.ts
│   ├── menu.integration.test.ts
│   ├── orders.integration.test.ts
│   ├── reservations.integration.test.ts
│   └── reviews.integration.test.ts
├── e2e/                     # End-to-end flow tests
│   ├── auth-flow.e2e.test.ts
│   ├── menu-browse.e2e.test.ts
│   ├── order-flow.e2e.test.ts
│   └── reservation-flow.e2e.test.ts
├── fixtures/                # Test data factories
│   ├── menu.fixtures.ts
│   ├── order.fixtures.ts
│   ├── reservation.fixtures.ts
│   └── user.fixtures.ts
└── vitest.config.ts         # Test configuration
```

## Running Tests

```bash
# Run all tests
make test

# Run server tests only
make test-server

# Run client tests only
make test-client

# Run with coverage
make test-coverage

# Run E2E tests
make test-e2e

# Run in watch mode
cd server && npm run test:watch
```

## Configuration

### Vitest Config (`tests/vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 10000,
    hookTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["server/src/**/*.ts"],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
});
```

## Writing Tests

### Unit Tests

Unit tests verify individual functions and methods in isolation.

```typescript
import { describe, it, expect } from "vitest";
import { MenuItemModel } from "../../server/src/models/menuItem";

describe("MenuItemModel", () => {
  describe("findById", () => {
    it("should return null for non-existent id", async () => {
      const result = await MenuItemModel.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests

Integration tests verify API endpoints using supertest.

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../server/src/app";

describe("POST /api/auth/register", () => {
  it("should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "Pass123!",
        name: "Test User",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("test@example.com");
    expect(res.body.data.token).toBeDefined();
  });

  it("should reject duplicate email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@example.com",
        password: "Pass123!",
        name: "Test User",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});
```

### E2E Tests

E2E tests verify complete user flows.

```typescript
import { describe, it, expect } from "vitest";

describe("Order Flow E2E", () => {
  it("should complete order creation flow", async () => {
    // 1. Register/Login
    // 2. Browse menu
    // 3. Add items to cart
    // 4. Create order
    // 5. Verify order status
    // 6. Track order
  });
});
```

## Mocking Patterns

### Database Mocking

```typescript
import { vi } from "vitest";
import * as database from "../config/database";

vi.mock("../config/database", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
  testConnection: vi.fn().mockResolvedValue(true),
}));

// In test
const mockQuery = vi.mocked(database.query);
mockQuery.mockResolvedValue({
  rows: [{ id: "1", name: "Test" }],
  rowCount: 1,
});
```

### Email Service Mocking

```typescript
import { emailService } from "../services/emailService";

vi.mock("../services/emailService", () => ({
  emailService: {
    sendOrderConfirmation: vi.fn().mockResolvedValue(true),
    sendPasswordReset: vi.fn().mockResolvedValue(true),
    sendPasswordResetConfirmation: vi.fn().mockResolvedValue(true),
  },
}));

// In test
expect(emailService.sendOrderConfirmation).toHaveBeenCalledWith({
  orderId: expect.any(String),
  customerName: "Test User",
  items: expect.any(Array),
  total: expect.any(Number),
});
```

### Stripe Service Mocking

```typescript
import { stripeService } from "../services/stripeService";

vi.mock("../services/stripeService", () => ({
  stripeService: {
    createPaymentIntent: vi.fn().mockResolvedValue({
      id: "pi_mock",
      status: "succeeded",
      amount: 2598,
    }),
  },
}));
```

### WebSocket Mocking

```typescript
import { emitToUser, emitToAdmins } from "../config/socket";

vi.mock("../config/socket", () => ({
  emitToUser: vi.fn(),
  emitToAdmins: vi.fn(),
  emitToOrder: vi.fn(),
  emitToKitchen: vi.fn(),
}));
```

### Request/Response Mocking

```typescript
import { vi } from "vitest";

function createMockReq(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: null,
    ...overrides,
  };
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
}

function createMockNext() {
  return vi.fn();
}
```

## Test Fixtures

Fixtures provide reusable test data.

```typescript
// user.fixtures.ts
export function createTestUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    phone: "+1234567890",
    role: "customer",
    ...overrides,
  };
}

// order.fixtures.ts
export function createTestOrder(overrides = {}) {
  return {
    id: "test-order-id",
    user_id: "test-user-id",
    status: "pending",
    total: 25.98,
    items: [
      { menu_item_id: "item-1", quantity: 2, unit_price: 12.99, subtotal: 25.98 },
    ],
    ...overrides,
  };
}
```

## Coverage Goals

| Metric     | Target | Current |
|------------|--------|---------|
| Statements | 70%    | --      |
| Branches   | 70%    | --      |
| Functions  | 70%    | --      |
| Lines      | 70%    | --      |

### Coverage Reports

```bash
# Generate coverage report
make test-coverage

# Open HTML report
open server/coverage/index.html
```

## E2E Testing Setup

### Prerequisites

- Running test database (SQLite or PostgreSQL test DB)
- Server running on test port

### Running E2E Tests

```bash
# Ensure test database is ready
cd server && npm run db:migrate

# Run E2E tests
make test-e2e
```

### E2E Test Environment

E2E tests use a separate environment configuration:

```env
NODE_ENV=test
DATABASE_URL=postgresql://localhost:5432/italian_restaurant_test
```

## Best Practices

1. **Test isolation**: Each test should be independent; no shared state
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Descriptive names**: Test names should describe expected behavior
4. **Fast feedback**: Unit tests < 100ms, integration tests < 5s
5. **Mock external services**: Never call real email/Stripe APIs in tests
6. **Use fixtures**: Reuse test data factories
7. **Clean up**: Reset mocks and database state between tests
