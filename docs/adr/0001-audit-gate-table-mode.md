---
title: "ADR-0001: Run pnpm audit in table mode, not --json"
status: accepted
date: 2026-10-04
deciders: repo owner
---

# ADR-0001: Run `pnpm audit` in table mode, not `--json`

## Context and Problem

The repo needed a dependency-audit gate that actually holds. `pnpm.auditConfig.ignoreGhsas`
was populated with 44 measured GHSA IDs, but CI still reported advisories and the audit step
exited 1.

The cause was not an incomplete list. `pnpm audit` behaves differently per output mode:

| Mode | Applies `ignoreGhsas`? | Exit code with all 44 ignored |
| :-- | :-- | :-- |
| table (default) | yes — `Severity:` line reads `56 high (56 ignored) | 3 critical (3 ignored)` | **0** |
| `--json` | **no** — `.metadata.vulnerabilities` still reports `high: 56, critical: 3` | **1** |

Measured on pnpm 9.15.0 against this lockfile. `.metadata.vulnerabilities` counts ignored
advisories as if they were present.

`.github/workflows/test.yml` was running `--json` (to build an annotation with a severity
breakdown), so the ignore list had **no effect on CI's exit state at all**.

## Decision

Run `pnpm audit --audit-level=high` in table mode, capture the exit code explicitly, and
`cat` the output. Drop `--json` and the `jq` summary step.

## Consequences

- The 44-entry ignore list now governs the exit code, which is what makes the gate real.
- The annotation loses the per-severity tally. Accepted: that tally read as "56
  outstanding" on every run when all 56 are accepted, which was misleading. The numbers
  remain on the run page as the `Severity:` line in the step log.
- `audit.txt` is a few KB. The `--json` report reached ~396 MB because it expands every
  dependency path, so dropping it also removes the temptation to print it.

## Alternatives considered

- **Upgrade pnpm past 9.15.0.** Rejected: the version is pinned for reproducibility, and the
  diff here is one line of workflow YAML against the version change plus lockfile churn.
- **Fix `auditConfig` with a pnpm override.** Rejected for the 41 bundle-absent GHSAs — a
  version bump cannot make a module stop existing in the bundle.
- **Keep `--json` and filter with `jq` in the workflow.** Rejected: it moves the gate out of
  the tool and into a shell pipeline, so the ignore set becomes a workflow concern rather
  than a dependency manifest concern.

## Verification

Removing one ignored GHSA (`GHSA-xq3m-2v4x-88gg`, a critical) flips the exit code to 1 and
the severity line to `3 critical (2 ignored)`. Restoring it returns 0. The gate is not
vacuous.

## Links

- `package.json` — `pnpm.auditConfig.ignoreGhsas`
- `docs/followups.md` — "Accepted advisories (ignoreGhsas)"
- [ADR-0002](0002-audit-gate-removes-continue-on-error.md)