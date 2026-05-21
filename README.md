# MTG Price Tracker

Track your Magic: The Gathering collection's value.

## Tech Stack

**Backend** — Fastify 5, Drizzle ORM, Better Auth (GitHub OAuth), PostgreSQL, Zod 4  
**Frontend** — Vue 3, Vue Router 5, TanStack Vue Query, Vite 8  
**Dev tools** — TypeScript 6, pnpm 11, ESLint (`@antfu/eslint-config`), Dev Containers

## Prerequisites

- Node.js 24
- pnpm 11
- PostgreSQL 16+
- A [GitHub OAuth App](https://github.com/settings/developers)

## Getting Started

```bash
git clone <repo-url>
cd mtgPrice
pnpm install
```

Copy the environment template and fill in your values:

```bash
cp backend/.env.example backend/.env
```

### Environment Variables (`backend/.env`)

| Variable               | Description                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`         | PostgreSQL connection string                                       |
| `GITHUB_CLIENT_ID`     | GitHub OAuth App client ID                                         |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret                                     |
| `BETTER_AUTH_SECRET`   | Better Auth secret (run `openssl rand -hex 32`)                    |
| `BETTER_AUTH_URL`      | Frontend URL (default: `http://localhost:5173`)                    |
| `CORS_ORIGIN`          | Comma-separated allowed origins (default: `http://localhost:5173`) |

### Database

```bash
pnpm --filter backend db:generate   # Generate Drizzle migrations
pnpm --filter backend db:migrate    # Apply migrations
```

### Run

```bash
pnpm dev            # Start backend (:3000) and frontend (:5173) concurrently
pnpm --filter backend dev   # Backend only
pnpm --filter frontend dev  # Frontend only
```

Visit `http://localhost:5173` and sign in with GitHub.

## License

MIT
