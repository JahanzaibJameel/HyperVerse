---
title: "ADR-0003: Declare babel-preset-expo as a direct dependency"
status: accepted
date: 2026-10-04
deciders: repo owner
---

# ADR-0003: Declare `babel-preset-expo` as a direct dependency

## Context and Problem

`babel.config.js` references `babel-preset-expo` by name. It was not in `package.json`, and
had no entry in the `pnpm-lock.yaml` `importers` block — it resolved only as a transitive
dependency of `expo`.

Consequence at the repo root: `require.resolve('babel-preset-expo')` failed with
`MODULE_NOT_FOUND`.

**The app nevertheless built.** `@expo/metro-config/build/loadBabelConfig.js` does
`require('babel-preset-expo')` from its own module scope. Because that file lives under
`node_modules/.pnpm`, its require walk-up reaches pnpm's hidden hoisted
`node_modules/.pnpm/node_modules`, where the package sits. Resolution therefore succeeded
from inside the store while failing from the root.

This was surfaced during a ship review, where a first pass at the evidence concluded the app
could not bundle. That conclusion was **wrong** — `npx expo export` produced 2448 modules.
The error was real; the attribution was not.

## Decision

Declare `babel-preset-expo` as a direct `devDependency` at `^54.0.12`, matching the
`~54.0.12` range `expo@54.0.37` declares, deduplicating to the single copy already in the
store.

## Consequences

- Resolution from the repo root works, so the build no longer depends on pnpm's directory
  layout or on `@expo/metro-config`'s internal require behaviour. Neither is a contract.
- The project's own `babel.config.js` now resolves the preset rather than relying on the
  injected one. Verified: the web bundle stays at 2130 modules with identical output.

## Notes on the version

`pnpm add -D babel-preset-expo` resolves to `^57.0.13` — the latest major — which is **not**
what Expo expects. That was tried first and reverted: it left two copies of the preset in
the tree and would have made `babel.config.js` use 57.0.13 while Expo's internals used
54.0.12. The range must track `expo`'s.

`--save-prefix="~"` did not take effect under pnpm 9.15.0, so the manifest reads `^54.0.12`.
That stays inside Expo's major line and resolves to the same copy. Tightening it to `~` by
hand would desync the lockfile specifier and be rewritten on the next install.

## Alternatives considered

- **Change nothing.** Rejected: the build worked, but it worked by accident. An undeclared
  dependency that the build silently relies on is the same class of defect as a stale lockfile.
- **Remove `babel.config.js` and let Expo inject its preset.** Rejected: this project needs
  `unstable_transformImportMeta` and the decorator plugin for WatermelonDB models. The
  project config is doing real work.

## Links

- [ADR-0004](0004-ci-verifies-bundle-builds.md) — the missing CI check that let this hide
- `docs/followups.md` — "pnpm resolution — expo/bin/cli entry-point sensitivity"