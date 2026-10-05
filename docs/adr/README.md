---
title: Architecture decision records
description: Why the codebase is shaped the way it is. Each record captures one decision, the alternatives considered, and what would reverse it.
status: reference
last_verified: 2026-10-05
audience: all
---

# Architecture decision records

Decision history for HyperVerse. An ADR is written when a choice was *contested* — when
more than one approach was defensible and the reason for the winner is not recoverable
from the diff alone. Routine changes do not get one.

Format: [MADR](https://adr.github.io/madr/) 3.0.0, trimmed. Status is one of `proposed`,
`accepted`, `superseded by ADR-NNNN`, or `deprecated`.

| # | Decision | Status | Date |
| :-- | :-- | :-- | :-- |
| [0001](0001-audit-gate-table-mode.md) | Run `pnpm audit` in table mode, not `--json` | accepted | 2026-10-04 |
| [0002](0002-audit-gate-removes-continue-on-error.md) | Remove `continue-on-error` from the audit job | accepted | 2026-10-04 |
| [0003](0003-declare-babel-preset-expo.md) | Declare `babel-preset-expo` as a direct dependency | accepted | 2026-10-04 |
| [0004](0004-ci-verifies-bundle-builds.md) | Add a web export step to `test.yml` | accepted | 2026-10-04 |
| [0005](0005-rederive-dbid-on-cold-start.md) | Re-derive `dbId` on cold start rather than at setup | accepted | 2026-10-04 |
| [0006](0006-delete-appcontext.md) | Delete `context/AppContext.tsx` rather than migrate it | accepted | 2026-10-05 |

## What is deliberately *not* recorded here

These are open decisions, not settled ones. They live in `docs/followups.md` until someone
picks an option, at which point they become ADRs:

- **XP persistence.** `partialize` versus write-through-the-model. A real fork in the data
  layer's source of truth, not yet decided.
- **Branch protection.** Whether the required-check string survived the audit job rename.
  Blocked on repository access, not on judgement.