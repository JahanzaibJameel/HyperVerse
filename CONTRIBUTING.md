---
title: Contributing
description: How to set up, verify, and propose changes to HyperVerse, with commands that actually work.
status: pre-release
last_verified: 2026-10-05
audience: contributor
---

# Contributing

**`pre-release`** · verified `2026-10-05` · ~7 min read

> [!NOTE]
> This document previously required "85%+ coverage", described Husky pre-commit hooks, and
> told contributors to run `pnpm lint:fix`. None of those exist: there is no `.husky/`
> directory and no Prettier config. Since then `lint:fix` has been added, coverage has risen to
> 40.52% of statements, and CI enforces typecheck and lint. The requirements below are ones the repository can
> actually enforce.

## Contents

1. [Setup](#1-setup)
2. [The verification gate](#2-the-verification-gate)
3. [Running things](#3-running-things)
4. [Conventions](#4-conventions)
5. [Where code goes](#5-where-code-goes)
6. [Testing](#6-testing)
7. [WatermelonDB rules](#7-watermelondb-rules)
8. [Commits and branches](#8-commits-and-branches)
9. [Reporting bugs](#9-reporting-bugs)
10. [What is not in place](#10-what-is-not-in-place)

---

## 1. Setup

Requires Node 20+ (CI uses Node 24) and pnpm 9.15.0.

```bash
git clone https://github.com/JahanzaibJameel/HyperVerse.git
cd HyperVerse
pnpm install
npx expo start
```

> [!CAUTION]
> Do not use `pnpm dev`. That script interpolates `$REPLIT_DEV_DOMAIN`, `$REPL_ID`, and `$PORT`
> and uses POSIX inline env assignment, so it only works inside a Replit workspace. Tracked as
> [ROADMAP Stage 0](ROADMAP.md#stage-0--make-it-honest).

A device or simulator needs a development build, because the app uses native modules Expo Go
does not bundle:

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

## 2. The verification gate

Run all three before opening a pull request:

```bash
pnpm verify         # typecheck + lint + test, in that order
```

Or individually:

```bash
npm run typecheck   # must report 0 errors
npm run lint        # must report 0 errors, 0 warnings
npm test            # must report 219 passed / 219 total
```

> [!NOTE]
> `npm run lint` is check-only and will not modify your working tree. Use `npm run lint:fix`
> when you want ESLint to apply fixes for you. CI runs `typecheck`, `lint`, `test`, and
> `test:coverage`, so all four must pass before a pull request merges.

## 3. Running things

| Task | Command |
| :-- | :-- |
| Dev server | `npx expo start` |
| Typecheck | `npm run typecheck` |
| Tests | `npm test` |
| Tests, watch | `npm run test:watch` |
| Coverage | `npm run test:coverage` |
| One test file | `npx jest __tests__/unit/services/AuthService.test.ts` |
| Lint (check-only) | `npm run lint` |
| Lint and apply fixes | `npm run lint:fix` |
| Static Expo Go build | `npm run build` |
| Serve the build | `npm run serve` |
| E2E (Detox) | `npm run test:e2e` — needs an emulator and a built app |
| Storybook | `npm run storybook` — port 8082 |
| Storybook (web) | `npm run storybook:web` |

## 4. Conventions

There is no Prettier config and no Husky setup, so formatting is not enforced automatically.
Match the surrounding file. The rules that *are* enforced:

- `tsc --noEmit` must be clean.
- ESLint: 0 errors and 0 warnings. Both are treated as failures in CI.
- `@typescript-eslint/no-shadow` is an **error**. A local `colors` inside a component that
  already calls `useColors()` will fail the build.
- `react-hooks/rules-of-hooks` and `no-debugger` are errors.

> [!NOTE]
> TypeScript uses `experimentalDecorators` and `useDefineForClassFields: false`, which
> WatermelonDB's decorators require. Do not enable `useDefineForClassFields`.

## 5. Where code goes

| Path | Contents |
| :-- | :-- |
| `app/` | Expo Router routes, one file per screen |
| `components/` | Reusable UI. 21 components, flat, plus `components/lazy/` |
| `lib/database/` | Schema, adapter, models |
| `lib/services/` | Business logic |
| `lib/stores/` | Zustand state |
| `lib/ai/` | Model manager, vector store, AI service |
| `hooks/` | Custom hooks (`useColors` today) |
| `constants/` | `colors.ts` |
| `__tests__/` | Mirrors the above layout |

> [!IMPORTANT]
> The database is not yet wired to the UI, so most feature work should be paired with a
> decision about where data lives. Connecting the screens to `lib/database` is the project's
> highest-priority item, and new work that writes to `dataStore` will add to the debt. See
> [ROADMAP Stage 1](ROADMAP.md#stage-1--persist-real-data).

## 6. Testing

```text
__tests__/
├── unit/          useColors · AuthService · User/Task model logic
├── integration/   authFlow — real service + store
├── components/    GlowCard · NeonButton
├── database/      smoke test — real WatermelonDB CRUD
└── e2e/           Detox, excluded from Jest
```

Details on mocks and the LokiJS swap are in [docs/TESTING.md](docs/TESTING.md).

Two rules when adding tests:

- **Test the real implementation where you can.** A test that asserts behaviour on a module it
  has `jest.mock`ed is asserting its own mock. `authFlow.test.tsx` previously did this in five
  places; those tests now use the real `AuthService`.
- **If you add an E2E spec**, remember it is excluded from Jest by `testPathIgnorePatterns` and
  will not run in CI until Detox is wired up.

## 7. WatermelonDB rules

These caused real bugs during development and are now enforced by the models.

**1. `Model.update()` only works inside a writer block.**

```ts
await database.write(async () => {
  await task.complete();
});
```

Otherwise WatermelonDB throws `Model.update() can only be called from inside of a Writer`.

**2. Never assign to `@readonly` fields.** `createdAt` and `updatedAt` are `@readonly @date`;
WatermelonDB sets them on every write. Assigning throws
`Attempt to set new value on a property marked as @readonly`.

**3. Query with `Q.where`, not callbacks.** `collection.query(fn)` does not exist in 0.27.

> [!TIP]
> If you change a model, add or extend a case in `__tests__/database/smoke.test.ts` so the
> behaviour is verified against the real model, not only a hand-written mock.

## 8. Commits and branches

Branches: `feature/…`, `fix/…`, `docs/…`, `refactor/…`.

Messages follow Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`,
`chore:`). This is a convention only — no tooling enforces it. The
[PR template](.github/pull_request_template.md) exists; fill it in.

## 9. Reporting bugs

Use `.github/ISSUE_TEMPLATE/bug_report.md` and include what you did, what you expected, what
happened, the platform, and whether you are running a development build or Expo Go.

Security issues: do not open a public issue. See
[SECURITY §5](SECURITY.md#5-reporting-a-vulnerability).

## 10. What is not in place

So you do not build on assumptions that do not hold:

- **No Prettier.** Formatting is unenforced.
- **No Husky.** No pre-commit hooks run. Use `pnpm verify` before pushing; CI runs the same
  three checks.
- **Storybook is wired up but not in CI.** `npm run storybook` starts it on port 8082. Stories
  are still typechecked and linted, but there is no visual regression check.
- **No Discord, no discussions, no annual contributor programme.** The previous version of this
  document linked to all three.
- **No coverage threshold**, in CI or locally.
- **No release automation** beyond `.github/workflows/release.yml`, which runs on `v*` tags.

---

**Status** `pre-release` · **verified** `2026-09-29` · [README](README.md) ·
[Architecture](ARCHITECTURE.md) · [Testing](docs/TESTING.md) ·
[Code of conduct](CODE_OF_CONDUCT.md)

[Edit this page](https://github.com/JahanzaibJameel/HyperVerse/blob/main/CONTRIBUTING.md) ·
[Open an issue](https://github.com/JahanzaibJameel/HyperVerse/issues/new)
