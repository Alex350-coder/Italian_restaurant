# Database Migrations

## Overview

This directory contains database migrations for the Italian Restaurant MVP across three database engines:

- **PostgreSQL** (`postgres/`) - Primary production database
- **MySQL** (`mysql/`) - Alternative production database
- **SQLite** (`sqlite/`) - Development/testing database

## Running Migrations

### PostgreSQL

```bash
# Using psql
psql -U postgres -d italian_restaurant -f migrations/postgres/001_create_users.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/002_create_menu.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/003_create_orders.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/004_create_reservations.sql
psql -U postgres -d italian_restaurant -f migrations/postgres/005_create_reviews.sql

# Or run all at once
cat migrations/postgres/*.sql | psql -U postgres -d italian_restaurant
```

### MySQL

```bash
# Using mysql client
mysql -u root -p italian_restaurant < migrations/mysql/001_schema.sql
```

### SQLite

```bash
# Using sqlite3
sqlite3 data/restaurant.db < migrations/sqlite/schema.sql
```

## File Naming Convention

Files are prefixed with numbers to ensure correct execution order:

1. `001_create_users.sql` - Users (required first for foreign keys)
2. `002_create_menu.sql` - Menu items
3. `003_create_orders.sql` - Orders and order items
4. `004_create_reservations.sql` - Reservations
5. `005_create_reviews.sql` - Reviews

## Schema Notes

### PostgreSQL

- Uses UUIDs generated via `uuid-ossp` extension
- Custom ENUM types for roles, statuses, and categories
- Automatic `updated_at` triggers on all tables
- Partial indexes for boolean flags (is_active, is_available, etc.)

### MySQL

- Uses CHAR(36) for UUID storage
- ENUM types for constrained values
- InnoDB engine with UTF8MB4 charset
- JSON column for menu item ingredients

### SQLite

- TEXT primary keys for UUIDs
- INTEGER for booleans (0/1)
- CHECK constraints for data validation
- JSON stored as TEXT

## Environment Variables

Set these before running migrations:

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=italian_restaurant
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=italian_restaurant
MYSQL_USER=root
MYSQL_PASSWORD=root
```

## Development vs Production

- **Development**: Use SQLite for speed, or Docker PostgreSQL/MySQL
- **Production**: Use PostgreSQL (recommended) or MySQL
- All migrations are idempotent and safe to re-run
