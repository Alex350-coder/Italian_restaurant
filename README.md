# Italian Restaurant MVP

> **⚠️ IMPORTANT — READ FIRST**
>
> This project is a **personal portfolio piece** created for demonstration purposes as part of my job search. It is **not a production-ready application** and several features are **not fully implemented**:
>
> - **Payments** — Stripe integration is present in the codebase but not wired to real payment processing. No actual transactions take place.
> - **Email notifications** — The email service is a mock that logs to the console; no real emails are sent.
> - **Security** — While security measures are in place (CSRF, rate limiting, etc.), this project has **not been security-audited** and should not be used in production.
>
> Built with assistance from [opencode.ai](https://opencode.ai) as a learning and development tool.

---

A full-stack Italian restaurant web application with real-time order tracking, table reservations, and an immersive 3D homepage experience.

## Tech Stack

| Layer       | Technology                                                        |
|-------------|-------------------------------------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind CSS, Three.js, Zustand      |
| Backend     | Node.js, Express, TypeScript, Socket.io, Zod, JWT                |
| Database    | PostgreSQL 16 (primary), Redis 7 (caching)                       |
| Testing     | Vitest, Supertest, Testing Library                                |
| DevOps      | Docker, Docker Compose, Nginx, Makefile                           |

## Features

- **Menu browsing** with category filters, search, and featured items
- **Online ordering** with real-time status updates via WebSocket
- **Table reservations** with availability checking and admin confirmation
- **Customer reviews** and ratings on menu items
- **User authentication** with JWT, refresh tokens, password reset flow
- **Admin dashboard** with order statistics, reservation management, and audit logs
- **3D interactive homepage** built with Three.js / React Three Fiber
- **Email notifications** for order confirmations, reservation updates, and password resets
- **Payment processing** via Stripe integration
- **Security hardening**: rate limiting, IP blacklisting, CSRF protection, input sanitization, account lockout
- **Offline support** with service worker caching and prefetching
- **Accessibility** features: skip links, focus management, ARIA labels, reduced motion

## Prerequisites

- **Node.js** 18+ (20 recommended)
- **npm** 9+
- **Docker** & Docker Compose (for containerized setup)
- **PostgreSQL** 16+ (if running locally without Docker)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd italian-restaurant

# Install all dependencies
make install

# Or install individually
make install-server
make install-client
```

## Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full environment variable reference.

Key variables:

| Variable          | Description                          | Default                          |
|-------------------|--------------------------------------|----------------------------------|
| `PORT`            | Server port                          | `3001`                           |
| `DATABASE_URL`    | PostgreSQL connection string         | `postgresql://postgres:postgres@localhost:5432/italian_restaurant` |
| `REDIS_URL`       | Redis connection string              | `redis://:redis@localhost:6379`  |
| `JWT_SECRET`      | Secret for JWT signing               | (must set)                       |
| `CORS_ORIGIN`     | Allowed CORS origin                  | `http://localhost:5173`          |
| `CLIENT_URL`      | Frontend URL                         | `http://localhost:5173`          |
| `SMTP_HOST`       | Email SMTP host                      | (optional for dev)               |

## Running Locally

### Development (recommended)

```bash
# Start everything with Docker (PostgreSQL + Redis)
make docker-up

# Run database migrations
make migrate

# Seed sample data
make db-seed

# Start dev servers (server + client)
make dev

# Or start individually
make dev-server   # http://localhost:3001
make dev-client   # http://localhost:5173
```

### Docker (full stack)

```bash
# Build and start all containers
make docker-build
make docker-up

# View logs
make docker-logs

# Stop
make docker-down
```

### Production

```bash
# Build for production
make build

# Start server
cd server && npm start
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
```

## API Documentation

Full API documentation is available at [docs/API.md](docs/API.md).

Quick overview:

| Endpoint                | Description                    |
|-------------------------|--------------------------------|
| `POST /api/auth/register` | Register a new user          |
| `POST /api/auth/login`    | Login and receive JWT token  |
| `GET /api/menu`           | Get menu items               |
| `POST /api/orders`        | Create an order              |
| `GET /api/orders/:id`     | Get order details            |
| `POST /api/reservations`  | Create a reservation         |
| `GET /api/reviews`        | Get reviews                  |
| `GET /api/health`         | Health check                 |

## Project Structure

```
italian-restaurant/
├── client/                    # React frontend
│   ├── src/
│   │   ├── 3d/                # Three.js 3D components
│   │   ├── components/        # UI and feature components
│   │   │   ├── features/      # Domain-specific components
│   │   │   ├── layout/        # Navbar, Footer
│   │   │   └── ui/            # Reusable UI primitives
│   │   ├── context/           # React contexts (Auth, Cart, Theme)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API client, caching, offline
│   │   └── utils/             # Helpers, validators, a11y
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB, env, security, socket config
│   │   ├── middleware/         # Auth, validation, rate-limit, CSRF
│   │   ├── models/            # Data access layer
│   │   ├── routes/            # API route handlers
│   │   ├── services/          # Business logic (email, notifications, Stripe)
│   │   └── utils/             # Error handling, pagination, sanitization
│   └── tsconfig.json
├── shared/types/              # Shared TypeScript types
├── migrations/                # SQL migration files
│   ├── postgres/
│   ├── mysql/
│   └── sqlite/
├── tests/                     # Test suites
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── docs/                      # Documentation
├── docker-compose.yml
├── Dockerfile.server
├── Dockerfile.client
├── nginx.conf
├── Makefile
└── .env.example
```

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines on code style, commit conventions, and the PR process.

## Documentation

- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing Guide](docs/TESTING.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Glossary](docs/GLOSSARY.md)

## License

MIT License. See [LICENSE](LICENSE) for details.
