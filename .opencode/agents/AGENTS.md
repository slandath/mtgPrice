# MTG Price Tracker

A web app to track the prices of Magic: The Gathering sealed booster boxes with automated price scraping.

## Agent Role
Please review to the AI Agent Guidelines located at ~/.config/opencode/AGENTS.md

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Node 24 + TypeScript |
| Server | Fastify |
| Scheduler | node-cron |
| Scraper | Cheerio (Playwright fallback) |
| ORM | Drizzle |
| Database | PostgreSQL (Railway hosted) |
| Frontend | Vue 3 + Vite + TypeScript |
| State | Pinia |
| Router | Vue Router |
| CSS | Tailwind |
| Monorepo | pnpm workspaces |
| Dev Env | VS Code Dev Container |

## Conventions

- Vue 3: Composition API exclusively, `<script setup lang="ts">`; typed `defineProps<...>()` / `defineModel`, no Options API
- Pinia: setup stores (`defineStore` with a setup function), typed refs returned from the store; no options-style stores
- Vue Router 4: `router.ts` per area with typed route records; guards via `beforeEach` + route meta
- Drizzle: schema in code first; migrations generated, never hand-edited
- Fastify: validate everything with typed schemas; single error handler; plugins for encapsulated features
- pnpm workspaces: use `pnpm -F <pkg> ...` filters; shared deps pinned in the workspace root