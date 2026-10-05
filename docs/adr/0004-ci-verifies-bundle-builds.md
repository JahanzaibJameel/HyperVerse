---
title: "ADR-0004: Verify the bundle builds in test.yml"
status: accepted
date: 2026-10-04
deciders: repo owner
---

# ADR-0004: Verify the bundle builds in `test.yml`

## Context and Problem

No CI job verified that the app bundles.

- `build.yml` ("Web Export (advisory)") is token-gated. With `EXPO_TOKEN` unset it exports
  nothing and deploys nothing — a permanent no-op that reports `success`.
- `test.yml` ran typecheck, lint, tests and coverage. None of them invoke a bundler.
- `npm run build` (`scripts/build.js`) is explicitly not exercised by CI.

So Metro and Babel were entirely unverified in CI. A regression that broke the app's
ability to bundle would have merged with a fully green pipeline — and CI would still not
have noticed afterwards.

This is the class of defect that [ADR-0003](0003-declare-babel-preset-expo.md) belongs to.
The undeclared dependency was survivable; the missing check is what made it invisible.

## Decision

Add a step to `test.yml`, after Lint and before the tests:

```yaml
- name: Verify bundle builds
  run: npx expo export --platform web --output-dir /tmp/hv-export-check
```

**Web only.** It exercises the same Metro + Babel transform path as the native platforms
for all JS, needs no native toolchain, and runs in ~45s on Linux CI.

## Consequences

- The missing-dependency class of bundling regression now fails the pipeline.
- Web export output is ~10 MB of files written to a temp directory on every run. Acceptable;
  the runner discards it.
- iOS and Android exports are deliberately **not** in `test.yml`. They need native
  toolchains and belong in a build job.

## Alternatives considered

- **Fix `build.yml` to run unconditionally.** Rejected for now: it would make the deploy
  path a required status check with an unconfigured token, i.e. permanently red. It needs a
  token decision first.
- **Run `expo export` for all three platforms.** Rejected: slow, and the native platforms
  add no coverage of the JS transform path.
- **Assert on bundle output rather than exit code.** Rejected: an assertion invites
  thresholds that will fail on unrelated changes. Exit 0 is the right contract.

## Links

- `.github/workflows/test.yml`
- `.github/workflows/build.yml` — why it is currently a no-op