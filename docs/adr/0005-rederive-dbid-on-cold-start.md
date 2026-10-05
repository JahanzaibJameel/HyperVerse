---
title: "ADR-0005: Re-derive dbId on cold start rather than at setup"
status: accepted
date: 2026-10-04
deciders: repo owner
---

# ADR-0005: Re-derive `dbId` on cold start rather than at setup

## Context and Problem

`AuthService.createInitialProfile` writes the SecureStore profile to the keychain **before**
`app/(auth)/setup.tsx` creates the `users` row. `setup.tsx` obtained the row id and attached
it to the in-memory store only:

```ts
const user = await UserRepository.upsertFromProfile(...);
markUnlocked({ ...profile, dbId: user.id });   // in-memory only
```

Nothing ever wrote it back. On the next launch, `useAppUnlock` rehydrated the keychain copy,
which has no `dbId`, so `user.dbId` was `undefined`.

Every primary screen gates on it:

```ts
if (!user?.dbId) return;   // index, tasks, habits, health, finance, ai, tasks/new, settings
```

The user completed onboarding, added tasks, logged a workout, force-quit, passed biometrics —
and landed on an empty dashboard, with every row intact in SQLite and unreachable.

The same `undefined` reached `deleteProfile(user?.dbId)` in settings, whose cascade is guarded
on `dbId` — so "delete all data" cleared the keychain and left every domain row in plaintext,
the exact outcome `AuthService.deleteProfile`'s own comment says must not happen.

## Decision

Re-derive `dbId` during launch initialisation in `useAppUnlock`, then persist the repaired
profile back to the keychain:

1. If the loaded profile already has `dbId`, do nothing.
2. Otherwise `UserRepository.findByDeviceId(profile.deviceId)`.
3. If a row is found, set `dbId` and `saveUserProfile` so the next cold start needs no lookup.
4. If no row is found, leave `dbId` undefined. **Do not create a row.**
5. If the lookup throws, still return a usable profile rather than bricking the app.

## Consequences

- Existing installs are repaired without a reinstall. This is the reason for re-deriving
  rather than writing at setup.
- The lookup costs one indexed query per cold start until it succeeds, then stops.
- A missing row stays visible. Inventing one would mask a wiped database or a failed
  onboarding write, turning a loud failure into a silent empty account.

## Alternatives considered

- **Write `dbId` back at setup time.** Rejected: fixes fresh installs only. Every install
  already in the field stays broken — the opposite of what was needed.
- **Look the row up on every screen load.** Rejected: `findByDeviceId` was already a one-query
  fix; doing it in eight places would guarantee they drift.
- **Key queries off `deviceId` instead of `dbId`.** Deferred: it removes the join dependency
  but changes every repository signature. Not worth it for a relink problem.
- **Have `useAppUnlock` hard-fail when `dbId` is missing.** Rejected: a keychain or database
  hiccup would prevent launch entirely. Fail to a usable state, let the screens' existing
  guard hold.

## Known limit

WatermelonDB assigns random ids per row. A `dbId` persisted by one install does not match a
database restored or reinstalled under another, and `deviceId` is regenerated on fresh
install — so there is no re-derivation path for that case. Tracked in `docs/followups.md`
under "Session integrity". Not a regression; a known limitation.

Two options are open for deciding what to do about it:

- Derive `deviceId` from a stable platform identifier. iOS Keychain values survive
  reinstall; Android Keystore values do not survive uninstall, so this is partial and
  needs its own decision.
- Accept that reinstall means a fresh start, and make it visible to the user (copy on the
  setup screen), so the empty state is understood rather than discovered.

## Links

- `components/auth/useAppUnlock.ts`
- `__tests__/integration/profilePersistence.test.tsx` — drives the **rehydration** path,
  not the setup path, which is why the original bug was invisible to the suite
- `docs/followups.md` — "Session integrity — persisted dbId across reinstall or restore"