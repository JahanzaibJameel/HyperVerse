---
title: "ADR-0002: Remove continue-on-error from the audit job"
status: accepted
date: 2026-10-04
deciders: repo owner
---

# ADR-0002: Remove `continue-on-error` from the audit job

## Context and Problem

The audit job carried `continue-on-error: true`. Its consequence was not "the audit is
lenient" — it was that **a green tick meant nothing**. The job could not fail, so it could
not report anything, and the UI presented it identically to a passing check.

The job had also been renamed `audit (advisory)` at `13559ee` as a partial fix, which made
the tick read honestly but did not change the behaviour: a high-severity advisory was
surfaced as an annotation while the pipeline stayed green.

The tension is real: an audit gate that blocks unrelated fixes is a nuisance, and one that
cannot block is theatre.

## Decision

Remove `continue-on-error: true`. The job now gates.

## Consequences

- A new high or critical advisory outside the ignore list fails the pipeline and emits a
  `::warning::` pointing at `docs/followups.md`. That is the correct pair: the annotation
  says what, the red glyph says it matters.
- The job id `audit` was deliberately preserved when the display name changed, so any
  `needs:` reference or id-keyed configuration keeps resolving. Only the name-keyed
  required-check string is at risk — see "Branch protection" in `docs/followups.md`.
- The display name `audit (advisory)` is now **stale**: the job can fail. It was left alone
  deliberately, because renaming it in the same commit risks branch-protection drift and is
  cosmetic. Rename it once protection is confirmed.

## Alternatives considered

- **Leave `continue-on-error` and rely on the annotation.** Rejected: this is exactly the
  state that let the original defect survive — an annotation nobody blocks on.
- **Keep it advisory until the backlog is empty.** Rejected: the backlog will never be
  empty. A gate that is enabled "later" is a gate that is not enabled.

## Preconditions

Only valid because [ADR-0001](0001-audit-gate-table-mode.md) made the ignore list effective.
Before that, removing the flag would have made every run red for 44 advisories that were
already triaged and documented.

## Links

- `.github/workflows/test.yml` — `audit (advisory)` job
- `docs/followups.md` — "Audit job is `continue-on-error`. RESOLVED at `d9b76f0`"