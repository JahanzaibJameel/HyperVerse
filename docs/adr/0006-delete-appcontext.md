---
title: "ADR-0006: Delete context/AppContext.tsx rather than migrate it"
status: accepted
date: 2026-10-05
deciders: repo owner
---

# ADR-0006: Delete `context/AppContext.tsx` rather than migrate it

## Context and Problem

The repo carried two parallel state systems describing the same user:

- `lib/stores/authStore.ts` — Zustand, holds a `UserProfile` rehydrated from the keychain,
  and is what screens write to.
- `context/AppContext.tsx` — React context, seeded with a hardcoded `defaultUser`
  (`"Neural Runner"`, level 7, 3240/5000 XP) and persisted to AsyncStorage under `hv_user`.

`XPBar` read the second. Every screen that awards XP (`health`, `habits`, `finance`,
`tasks/new`) calls `useAuthStore().addXP`. So a user who had just completed onboarding and
held level 1 and 0 XP was told on the Home screen that they were level 7, and the bar never
moved no matter how much XP they earned.

It also declared a second, structurally similar `UserProfile` type — a standing source of
type confusion that three separate documents had flagged for deletion.

## Decision

Delete `context/AppContext.tsx`, repoint `XPBar` at `useAuthStore`, and remove the
`AppProvider` mount from `app/_layout.tsx` and the Storybook decorator.

## Rationale for deletion over migration

`useApp()` had exactly **one** caller. The other three references (`app/_layout.tsx`,
`.storybook/preview.tsx`, and the `XPBar` story) were providers or fixtures that existed
solely to feed it. Nothing read `health`, `finance`, `aiMessages`, `addMessage`, or
`clearMessages`. After the repoint the parallel system had zero readers.

Keeping a second source of truth alive "in case something needs it" is how it became a
second source of *truth* in the first place. A migration would have required deciding which
of the two systems owns `health`, `finance`, and AI message history — work for features
that no screen consumes.

## Consequences

- One `UserProfile` definition (`lib/services/AuthService.ts`).
- `XPBar` falls back to level 1 / 0 XP when there is no profile, so it reports an honest
  empty state instead of a fabricated figure.
- Web bundle drops 2131 → 2130 modules, which is the deleted file showing up in the output.
- `hv_user` is gone from AsyncStorage. No migration was written: the key held only the
  fabricated seed, so nothing real was lost.
- Four documents that described the file (`FOLDER_STRUCTURE.md`, `PROJECT_STRUCTURE.md`,
  `ROADMAP_V2.md`, `docs/STORYBOOK.md`) were updated in the same commit, because leaving
  them describing a deleted file is a new inaccuracy rather than pre-existing drift.
  `FOLDER_STRUCTURE.md` and `ROADMAP_V2.md` had already prescribed this deletion.

## Alternatives considered

- **Repoint only `XPBar`, leave `AppContext` for later.** Rejected: nothing else read it, so
  "later" had no task attached and the file would simply have persisted.
- **Wire `AppContext`'s `addXP` up instead.** Rejected: it writes to AsyncStorage under a
  different key from the keychain profile, so the two would still disagree.
- **Migrate `health` / `finance` / `aiMessages` into the store first.** Rejected: no screen
  consumes them. Building unrequested infrastructure to justify keeping a file is not a
  migration.

## Links

- `components/XPBar.tsx`
- `__tests__/components/XPBar.test.tsx` — asserts a live re-render; a bar still reading a
  hardcoded 3240 would fail it