# Trailim Firebase Session and Participation Persistence

## Scope

Task 7 adds Firebase persistence for:

- `/routeSessions/{sessionId}` — an independent experience bound permanently to one approved RouteVersion.
- `/routeSessions/{sessionId}/participations/{userId}` — one deterministic participation per authenticated user and session.

It does not migrate TaskResponse, answer evaluation, scoring authority, completion scoring, evidence, offline/PWA behavior, or deployment.

## Trusted operations

The Firebase Functions boundary exposes:

- `createRouteSession`
- `updateRouteSessionStatus`
- `joinRouteSession`
- `updateParticipationProgress`
- `abandonParticipation`

All writes use Admin SDK transactions. Ordinary Firestore clients cannot create or mutate either collection.

Session creation verifies active organization membership and teacher or exact route-team authority. It also verifies that the requested version belongs to the route and organization, has `approved` status, and equals `route.approvedVersionId`. An existing session never follows a later approved version.

Session transitions are forward-only: `open` may become `active`, `completed`, or `cancelled`; `active` may become `completed` or `cancelled`; completed and cancelled sessions are terminal.

## Participation uniqueness and progress

Participation documents use the authenticated Firebase UID as the document ID under one session, with canonical domain ID `${sessionId}_${userId}`. Concurrent joins therefore converge on one record. Two sessions for the same user and RouteVersion remain independent, including Learning and Challenge sessions.

Join/resume and progress operations require the parent session to be open or active and the caller to have active membership in the session organization. Trusted progress validates current/completed station IDs against the exact session-bound RouteVersion, rejects duplicates, and derives progress percentage from that version's station set. The compatibility request percentage is ignored. Progress cannot set score, completion time, identity fields, or version/session binding. Task 8 will own trusted task evaluation, scoring, and completion.

## Reads and Rules

Active organization members may read session metadata. A participant may read only their own participation; organization teachers may inspect participation summaries. All client writes are denied. Cross-organization and inactive users are denied.

Approved participant-visible RouteVersion metadata and stations are readable to active members of the route organization only when the version is the route's exact `approvedVersionId`. Protected AnswerKeys remain denied to every client.

## Feature boundary

`VITE_ENABLE_FIREBASE_SESSION_PARTICIPATION=true` opts an authenticated, configured client into this slice through the Firebase gateway and repository. No UI is switched by this task. The existing local VS1 session repository remains the functional fallback when the slice is disabled. A failed enabled Firebase operation must be surfaced; callers must not silently fall back to local state.

## Implementation truth

### REAL / FIREBASE (implemented and emulator-tested, not deployed)

- RouteSession and Participation persistence.
- Trusted approved-version session creation and lifecycle transitions.
- Transaction-safe join/resume, progress persistence, and abandonment.
- Session-specific mode isolation and terminal-session write gates.
- Firestore read boundaries and default-deny client writes.

### FUNCTIONAL LOCAL

- Existing RouteSession, Participation, TaskResponse, evaluation, scoring, and completion prototype.
- Existing creator, review, and participant UI paths.

### NOT MIGRATED

- TaskResponse and participant task submission.
- Protected answer evaluation, scoring authority, and trusted completion.
- Evidence/Storage, offline/PWA, marketplace/discovery, or production deployment.

## Validation

Run trusted workflow and session tests with `npm.cmd run test:workflow`, and client Rules tests with `npm.cmd run test:rules`.
