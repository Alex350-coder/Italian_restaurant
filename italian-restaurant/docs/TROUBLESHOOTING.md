# Troubleshooting Guide

## Database Connection Issues

### "Connection refused" or "ECONNREFUSED"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

1. Check if PostgreSQL is running:
   ```bash
   # Docker
   docker-compose ps postgres
   
   # Local
   pg_isready -h localhost -p 5432
   ```

2. Verify connection string in `.env`:
   ```bash
   # Docker
   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/italian_restaurant
   
   # Local
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/italian_restaurant
   ```

3. Check if the database exists:
   ```bash
   docker exec -it italian-postgres psql -U postgres -l
   ```

4. Restart the database container:
   ```bash
   docker-compose restart postgres
   sleep 5
   make migrate
   ```

### "Password authentication failed"

**Solutions:**
- Verify `POSTGRES_PASSWORD` in `.env` matches `DB_PASS`
- Reset password:
  ```bash
  docker-compose down -v
  docker-compose up -d postgres
  ```

### "Database does not exist"

```bash
docker exec -it italian-postgres psql -U postgres -c \
  "CREATE DATABASE italian_restaurant;"
make migrate
```

---

## Port Conflicts

### "Port 3001 already in use"

```bash
# Find process using the port
netstat -tlnp | grep :3001
# or
lsof -i :3001

# Kill the process
kill <PID>

# Or use a different port
PORT=3002 make dev-server
```

### "Port 5432 already in use"

```bash
# PostgreSQL is already installed locally
# Stop local PostgreSQL
sudo systemctl stop postgresql

# Or use Docker on a different port
# Edit docker-compose.yml:
# ports:
#   - "5433:5432"
```

### "Port 5173 already in use"

```bash
# Kill existing Vite process
kill $(lsof -t -i:5173)

# Or use different port
cd client && npx vite --port 5174
```

---

## TypeScript Errors

### "Cannot find module" or "Module not found"

```bash
# Reinstall dependencies
make clean
make install

# Or for specific project
cd server && rm -rf node_modules && npm install
cd client && rm -rf node_modules && npm install
```

### "Type 'X' is not assignable to type 'Y'"

1. Check the type definitions in `shared/types/`
2. Ensure models return the correct types
3. Update interfaces if schema changed

### "Argument of type 'string' is not assignable"

- Zod validation should coerce types
- Check if `z.coerce.number()` or `z.coerce.string()` is needed

### "Property does not exist on type"

- Check if you're importing from the correct path
- Verify `@/` path alias resolves correctly:
  ```bash
  # server
  ls server/src/
  
  # client  
  ls client/src/
  ```

---

## Build Failures

### Server Build

```bash
# Check TypeScript compilation
cd server && npx tsc --noEmit

# Common issues:
# 1. Missing type declarations
npm install --save-dev @types/<package>

# 2. Import path errors
# Use @/ alias: import { query } from "@/config/database"

# 3. Strict mode violations
# Add proper types to function parameters and returns
```

### Client Build

```bash
# Check TypeScript
cd client && npx tsc --noEmit

# Check Vite build
cd client && npx vite build

# Common issues:
# 1. Missing React types
npm install --save-dev @types/react @types/react-dom

# 2. JSX not configured
# Ensure tsconfig.json has: "jsx": "react-jsx"

# 3. Environment variables
# Use VITE_ prefix for client-side env vars
```

### Docker Build

```bash
# Rebuild without cache
docker-compose build --no-cache

# Check Dockerfile syntax
docker build -f Dockerfile.server .

# Common issues:
# 1. Node version mismatch
# Ensure Dockerfile uses node:20-alpine

# 2. Missing package-lock.json
npm install  # Regenerate lock file
```

---

## Cache Issues

### Stale Menu Data

```bash
# Clear Redis cache
docker exec italian-redis redis-cli -a redis FLUSHALL

# Or restart Redis
docker-compose restart redis
```

### Client-Side Cache

```bash
# Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cached images and files
# Firefox: Ctrl+Shift+Delete → Cache

# Or hard refresh
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

### Service Worker Issues

```bash
# Unregister service worker in browser DevTools
# Application → Service Workers → Unregister

# Or clear all site data
# Application → Storage → Clear site data
```

---

## WebSocket Issues

### "WebSocket connection failed"

1. Check if server is running:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Verify WebSocket transport:
   ```bash
   # In browser DevTools console
   const socket = io("http://localhost:3001");
   socket.on("connect", () => console.log("Connected"));
   socket.on("connect_error", (err) => console.error(err));
   ```

3. Check CORS configuration:
   ```bash
   # Verify CORS_ORIGIN matches client URL
   grep CORS_ORIGIN .env
   ```

### Events Not Received

1. Check room membership:
   ```bash
   # Server logs show room joins
   docker-compose logs -f server | grep SOCKET
   ```

2. Verify event names match between client and server

3. Check if JWT token is valid:
   ```bash
   # Re-login to get fresh token
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Pass123!"}'
   ```

---

## Email Issues

### "SMTP connection failed"

1. Check SMTP configuration in `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

2. For Gmail, use App Password (not regular password):
   - Go to Google Account → Security → 2-Step Verification
   - Generate App Password

3. Test SMTP connection:
   ```bash
   telnet smtp.gmail.com 587
   ```

### Emails Not Sending

- Check server logs for email errors
- Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` are set
- In development, check if emails are logged to console instead

---

## Docker Issues

### "Cannot connect to the Docker daemon"

```bash
# Start Docker
sudo systemctl start docker

# Or on Mac/Windows
# Open Docker Desktop
```

### "No space left on device"

```bash
# Clean up Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune
```

### Container Keeps Restarting

```bash
# Check container logs
docker-compose logs server

# Common issues:
# 1. Database not ready → Add health check dependency
# 2. Missing environment variables → Check .env
# 3. Port already in use → Kill existing process
```

### Slow Docker Build

```bash
# Use BuildKit for faster builds
DOCKER_BUILDKIT=1 docker-compose build

# Or rebuild specific service
docker-compose build --no-cache server
```

---

## Environment Variable Issues

### "Invalid environment variables"

The server validates env vars with Zod on startup. Common errors:

| Error                              | Solution                                    |
|------------------------------------|---------------------------------------------|
| `JWT_SECRET must be at least 16`   | Set a longer JWT_SECRET                     |
| `Invalid enum value`               | Check NODE_ENV is `development`/`production`/`test` |
| `Required`                         | Missing required env var                    |

### Client Env Vars Not Working

- Prefix with `VITE_` for client-side access
- Restart Vite dev server after changing env vars
- Use `import.meta.env.VITE_VAR_NAME` in client code

---

## General Debug Tips

### Enable Verbose Logging

```bash
# Server
DEBUG=socket.io:* make dev-server

# Database queries (development mode)
NODE_ENV=development make dev-server
```

### Check Process Status

```bash
# Docker
docker-compose ps
docker-compose logs --tail=50 server

# PM2
pm2 status
pm2 logs italian-server

# Local
ps aux | grep node
```

### Reset Everything

```bash
# Nuclear option: remove all data and start fresh
make clean-docker
make install
make docker-up
make migrate
make db-seed
make dev
```

### Get Help

1. Check server logs: `docker-compose logs -f server`
2. Check database: `docker exec -it italian-postgres psql -U postgres -d italian_restaurant`
3. Test API: `curl http://localhost:3001/api/health`
4. Check browser DevTools console and network tabs
