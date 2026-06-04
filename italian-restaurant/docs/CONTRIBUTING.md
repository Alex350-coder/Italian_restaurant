# Contributing Guidelines

## Code Style

### TypeScript

- Strict mode enabled (`"strict": true` in tsconfig)
- Use explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutability
- Avoid `any`; use `unknown` and narrow with type guards

### Naming Conventions

| Element          | Convention          | Example                    |
|------------------|---------------------|----------------------------|
| Variables        | camelCase           | `menuItem`, `orderTotal`   |
| Functions        | camelCase           | `findById`, `createOrder`  |
| Classes/Models   | PascalCase          | `UserModel`, `OrderModel`  |
| Interfaces       | PascalCase          | `CreateOrderInput`         |
| Enums            | PascalCase          | `OrderStatus`              |
| Constants        | UPPER_SNAKE_CASE    | `SALT_ROUNDS`, `ROOMS`     |
| Files (server)   | camelCase           | `menuItem.ts`, `auth.ts`   |
| Files (client)   | PascalCase          | `MenuPage.tsx`, `Cart.tsx` |
| Directories      | kebab-case          | `order-items/`, `features/`|

### File Structure

**Server:**
```
server/src/
├── config/        # Configuration files
├── middleware/     # Express middleware
├── models/        # Data access layer
├── routes/        # Route handlers
├── services/      # Business logic
└── utils/         # Shared utilities
```

**Client:**
```
client/src/
├── 3d/            # Three.js components
├── components/
│   ├── features/  # Domain components
│   ├── layout/    # Layout components
│   └── ui/        # Reusable UI primitives
├── context/       # React contexts
├── hooks/         # Custom hooks
├── pages/         # Route pages
├── services/      # API and caching
└── utils/         # Helpers
```

### Formatting

- Use the project's Prettier/ESLint config
- Run `make format` before committing
- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line structures
- Semicolons required

---

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                                      | Example                              |
|------------|--------------------------------------------------|--------------------------------------|
| `feat`     | New feature                                      | `feat(menu): add calorie display`    |
| `fix`      | Bug fix                                          | `fix(auth): prevent token leakage`   |
| `docs`     | Documentation only                               | `docs: update API reference`         |
| `style`    | Code style (no logic change)                     | `style: format with prettier`        |
| `refactor` | Code restructuring (no feature/fix)              | `refactor(order): extract validation`|
| `test`     | Adding or updating tests                         | `test: add order creation tests`     |
| `chore`    | Build, CI, dependencies                          | `chore: update dependencies`         |
| `perf`     | Performance improvement                          | `perf(menu): add database index`     |

### Scopes

| Scope         | Area                                  |
|---------------|---------------------------------------|
| `auth`        | Authentication and authorization      |
| `menu`        | Menu items and categories             |
| `order`       | Order creation and management         |
| `reservation` | Table reservations                    |
| `review`      | Customer reviews                      |
| `upload`      | File upload                           |
| `security`    | Security features                     |
| `client`      | Frontend only                         |
| `server`      | Backend only                          |
| `db`          | Database migrations/schema            |
| `docker`      | Docker configuration                  |

### Examples

```bash
feat(menu): add dietary filter options
fix(order): correct total calculation with tax
docs(API): add webhook documentation
test(auth): add registration edge cases
chore(docker): update PostgreSQL to 16-alpine
```

---

## PR Process

### 1. Create a Branch

```bash
git checkout -b feat/my-feature
```

### 2. Make Changes

- Follow code style guidelines
- Write tests for new functionality
- Update documentation if needed
- Run lint and typecheck before committing

### 3. Before Committing

```bash
# Run all checks
make lint
make typecheck
make test

# Format code
make format
```

### 4. Commit

```bash
git add .
git commit -m "feat(scope): description"
```

### 5. Push and Create PR

```bash
git push origin feat/my-feature
```

### 6. PR Description

Use this template:

```markdown
## What

Brief description of the change.

## Why

Reason for the change.

## How

Implementation details.

## Testing

How was this tested?

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass (`make test`)
- [ ] Lint passes (`make lint`)
- [ ] Typecheck passes (`make typecheck`)
- [ ] Documentation updated (if needed)
- [ ] No console.log in production code
- [ ] No secrets or keys committed
```

---

## Branch Naming

| Pattern              | Description                    | Example                       |
|----------------------|--------------------------------|-------------------------------|
| `feat/<name>`        | New feature                    | `feat/reservation-calendar`   |
| `fix/<name>`         | Bug fix                        | `fix/order-total-calc`        |
| `docs/<name>`        | Documentation                  | `docs/api-webhooks`           |
| `refactor/<name>`    | Code refactoring               | `refactor/auth-middleware`     |
| `test/<name>`        | Test additions                 | `test/order-e2e`              |
| `chore/<name>`       | Maintenance tasks              | `chore/deps-update`           |
| `hotfix/<name>`      | Critical production fix        | `hotfix/auth-bypass`          |

---

## Review Checklist

### Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings/errors
- [ ] Code is readable and well-organized
- [ ] No dead code or commented-out code
- [ ] Error handling is comprehensive

### Security

- [ ] No secrets or keys in code
- [ ] Input validation uses Zod schemas
- [ ] SQL queries are parameterized
- [ ] Auth checks are in place
- [ ] No sensitive data in logs

### Testing

- [ ] New code has test coverage
- [ ] All existing tests pass
- [ ] Edge cases are covered
- [ ] Mocks are properly cleaned up

### Performance

- [ ] No N+1 queries
- [ ] Database queries are indexed
- [ ] No unnecessary re-renders (client)
- [ ] Large lists use virtualization

### Documentation

- [ ] API changes documented
- [ ] Environment variables documented
- [ ] README updated if needed
- [ ] Inline comments for complex logic

### Compatibility

- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation, screen readers)
- [ ] Dark mode support (if UI changes)
