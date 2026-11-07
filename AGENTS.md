# AGENTS.md

## Verification gate (mandatory)

After every new feature and every refactor, run the full verification gate.
All of it must pass before the work is considered done.

```sh
pnpm test            # backend + frontend unit tests (Vitest)
pnpm lint            # Oxlint
pnpm fmt:check       # Oxfmt
pnpm -r type-check   # tsc (backend) + vue-tsc (frontend)
```

Per-package equivalents: `pnpm --filter backend test`, `pnpm --filter frontend test`.

## Rules

- Do not merge or hand off work with any red or skipped check in this gate.
- A failing existing test is a real contract: fix the change, never weaken,
  delete, or skip the test to get green.
- New behavior needs a matching test: co-locate it (`foo.ts` → `foo.test.ts`),
  mock only at module boundaries (fetch, db, auth, router), no network or
  live services.
- Keep generated output out of the tree: `coverage/` is gitignored — never
  commit it.
