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