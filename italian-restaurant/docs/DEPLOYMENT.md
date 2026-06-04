# Deployment Guide

## Docker Deployment (Recommended)

### Prerequisites

- Docker 20.10+
- Docker Compose v2+

### Quick Start

```bash
# Clone and enter the project
git clone <repo-url> && cd italian-restaurant

# Create environment file
cp .env.example .env
# Edit .env with production values

# Build and start all services
docker-compose up -d --build

# Verify services are running
docker-compose ps
```

### Services

| Service    | Container          | Port  | Description              |
|------------|--------------------|-------|--------------------------|
| postgres   | italian-postgres   | 5432  | PostgreSQL database       |
| redis      | italian-redis      | 6379  | Redis cache              |
| server     | italian-server     | 3001  | Express API server       |
| client     | italian-client     | 80/443| Nginx + React frontend   |

### Volume Management

```bash
# List volumes
docker volume ls | grep italian

# Backup database
docker exec italian-postgres pg_dump -U postgres italian_restaurant > backup.sql

# Restore database
cat backup.sql | docker exec -i italian-postgres psql -U postgres -d italian_restaurant
```

### Container Health

```bash
# Check health status
docker-compose ps

# View container logs
docker-compose logs -f server
docker-compose logs -f postgres

# Restart a specific service
docker-compose restart server
```

---

## Manual Deployment

### 1. System Requirements

- Node.js 18+ (20 recommended)
- PostgreSQL 16+
- Redis 7+ (optional, for caching)
- Nginx (for production frontend)

### 2. Install Dependencies

```bash
# Server
cd server && npm ci --only=production

# Client
cd client && npm ci && npm run build
```

### 3. Database Setup

```bash
# Create database
createdb italian_restaurant

# Run migrations
psql -U postgres -d italian_restaurant -f migrations/postgres/001_create_users.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/002_create_menu.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/003_create_orders.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/004_create_reservations.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/005_create_reviews.sql

# Or run all at once
cat migrations/postgres/*.sql | psql -U postgres -d italian_restaurant

# Seed sample data
cd server && npm run seed
```

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with production values
```

### 5. Build and Run

```bash
# Build server
cd server && npm run build

# Start server
NODE_ENV=production node dist/index.js

# Build client (output goes to client/dist)
cd client && npm run build
```

### 6. Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start dist/index.js --name italian-server

# Save process list
pm2 save

# Auto-start on boot
pm2 startup
```

---

## Environment Variables Reference

### Server Variables

| Variable          | Type   | Required | Default                          | Description                        |
|-------------------|--------|----------|----------------------------------|------------------------------------|
| `NODE_ENV`        | enum   | no       | `development`                    | `development`, `production`, `test`|
| `PORT`            | number | no       | `3001`                           | Server listen port                 |
| `DB_HOST`         | string | no       | `localhost`                      | PostgreSQL host                    |
| `DB_PORT`         | number | no       | `5432`                           | PostgreSQL port                    |
| `DB_NAME`         | string | no       | `italian_restaurant`             | Database name                      |
| `DB_USER`         | string | no       | `postgres`                       | Database user                      |
| `DB_PASS`         | string | yes      | -                                | Database password                  |
| `DATABASE_URL`    | string | yes      | -                                | Full PostgreSQL connection string  |
| `REDIS_URL`       | string | no       | -                                | Redis connection string            |
| `JWT_SECRET`      | string | yes      | -                                | JWT signing secret (min 16 chars)  |
| `JWT_EXPIRES_IN`  | string | no       | `7d`                             | Access token expiry                |
| `CORS_ORIGIN`     | string | no       | `http://localhost:5173`           | Allowed CORS origin                |
| `CLIENT_URL`      | string | no       | `http://localhost:5173`           | Frontend URL for email links       |
| `SMTP_HOST`       | string | no       | -                                | SMTP server host                   |
| `SMTP_PORT`       | number | no       | `587`                            | SMTP server port                   |
| `SMTP_USER`       | string | no       | -                                | SMTP username                      |
| `SMTP_PASS`       | string | no       | -                                | SMTP password                      |
| `SMTP_FROM`       | string | no       | `noreply@italianrestaurant.com`  | Sender email address               |
| `MAX_FILE_SIZE`   | number | no       | `10485760`                       | Max upload size in bytes (10MB)    |
| `UPLOAD_DIR`      | string | no       | `./uploads`                      | Upload directory path              |
| `RATE_LIMIT_WINDOW_MS` | number | no | `900000`                         | Rate limit window (15 min)         |
| `RATE_LIMIT_MAX_REQUESTS` | number | no | `100`                        | Max requests per window            |

### Client Variables

| Variable         | Type   | Default                          | Description                  |
|------------------|--------|----------------------------------|------------------------------|
| `VITE_API_URL`   | string | `http://localhost:3001/api`       | Backend API base URL         |

---

## Nginx Configuration

The included `nginx.conf` provides:

- Gzip compression for text, JSON, JavaScript, CSS, SVG
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- API proxy to backend server
- Static asset caching (1 year with immutable headers)
- SPA fallback for client-side routing
- Hidden file access denial

### Custom Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Include the rest of the configuration from nginx.conf
}
```

---

## SSL/TLS Setup

### Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Manual SSL

```bash
# Generate self-signed certificate (for testing)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/server.key \
  -out /etc/ssl/certs/server.crt
```

### Nginx SSL Configuration

```nginx
server {
    listen 443 ssl http2;

    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:3001/api/health
# {"success":true,"data":{"status":"ok","timestamp":"..."}}
```

### Docker Health Checks

All containers include health checks:

- **PostgreSQL**: `pg_isready` every 10s
- **Redis**: `redis-cli ping` every 10s
- **Server**: HTTP check on `/health` every 30s
- **Client**: HTTP check on `/` every 30s

### Logs

```bash
# Docker logs
docker-compose logs -f server
docker-compose logs -f postgres

# PM2 logs
pm2 logs italian-server

# Application logs (development)
# Query logs are printed in development mode
```

### Database Monitoring

```bash
# Connect to database
docker exec -it italian-postgres psql -U postgres -d italian_restaurant

# Check table sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

# Check active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.

### Quick Fixes

```bash
# Container won't start
docker-compose down -v && docker-compose up -d --build

# Database connection refused
docker-compose restart postgres && sleep 5 && make migrate

# Port already in use
netstat -tlnp | grep :3001
kill <PID>

# Reset everything
make clean-docker
docker-compose up -d --build
make migrate
make db-seed
```
