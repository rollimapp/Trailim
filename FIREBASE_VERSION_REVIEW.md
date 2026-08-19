# Trailim Firebase Version and Review Workflow

## Scope

Task 6 adds the trusted Firestore workflow for:

- `/routes/{routeId}/versions/{routeVersionId}` — exact immutable route-content snapshot plus workflow status metadata.
- `/routes/{routeId}/versions/{routeVersionId}/stations/{stationId}` — immutable participant-visible station/task snapshots.
- `/routes/{routeId}/versions/{routeVersionId}/answerKeys/{protectedRecordId}` — server-only task answers and protected QR/access-code records.
- `/reviews/{reviewId}` — exact-version Review records.

It also adds four callable Firebase Functions:

- `submitRouteDraft`
- `requestRouteChanges`
- `resubmitRoute`
- `approveRouteVersion`

No Function is deployed by this task.

## Trusted transaction boundary

`VersionReviewService` runs each operation in a Firestore transaction using the Admin SDK.

Submit/resubmit atomically:

1. authenticate through the callable boundary;
2. verify active organization and exact route-team authority;
3. verify the required Route state and coherent current draft/station identities;
4. read the highest version number and allocate the next number;
5. validate protected task/trigger input against every persisted draft task and protected trigger;
6. create the RouteVersion, public station snapshots, protected records, and a new exact-version Review;
7. update Route status and `latestSubmittedVersionId`.

All reads and writes are in the same transaction. Concurrent submits conflict on the Route read/update; only one can advance a draft route to `in_review`. The VS1 limit of 2–10 stations keeps the transaction below Firestore's write ceiling. If future task counts approach transaction limits, the data layout/atomicity boundary must be reviewed rather than silently split.

Request Changes atomically validates the current pending Review/version, teacher membership, and latest Route pointer; then it updates Review and Route state and sets protected draft workflow metadata `basedOnVersionId` to the reviewed version. Approval similarly validates the latest pending version before updating Review, version approval metadata, and `approvedVersionId`.

Duplicate submit, request-changes, and approve actions fail their state preconditions. A stale Review cannot override a newer submission.

## Snapshot and protected-data boundary

The trusted submit operation reads participant-safe RouteDraft/station documents and defensively removes answer/scoring and QR/passcode secret field names before creating public snapshots. V1 station/content documents are never updated when the draft changes or V2 is created.

Because Task 5 intentionally stores only participant-safe draft tasks, the creator callable supplies a narrow `ProtectedSubmissionInput`. Trusted logic requires exactly one protected answer record for every persisted task, globally unique task IDs, and a matching secret record for every protected trigger. It writes explicit allowlisted fields; caller-supplied IDs cannot override version identity or record type.

Protected task records use their `taskId` document ID. Protected trigger records use `trigger_{stationId}` in the same server-only collection. Firestore Rules deny every client—including creator and teacher—read/write access to that collection.

Protected authoring data is not yet a Firestore draft collection. Until a later authoring slice adds one, the enabled creator integration must retain and supply that data at submit/resubmit time. It must never be reconstructed from public snapshots.

## Exact-version review semantics

Every Review stores an immutable `routeVersionId`. Teacher preview reads the referenced RouteVersion and version stations via `FirestoreVersionReviewRepository`, never the mutable RouteDraft or legacy Route. Creator review reads use the same exact Review/version records.

Review target identity is client-immutable because all client writes to Reviews and RouteVersion trees are denied. Trusted operations may update only workflow status/decision metadata; submitted content and station snapshots remain unchanged.

## Client and local fallback boundary

`FirebaseVersionReviewGateway` calls the trusted Functions only when Firebase is configured, the user is authenticated, and `VITE_ENABLE_FIREBASE_VERSION_REVIEW=true`. Emulator use also connects the Functions client to `127.0.0.1:5001`.

Task 6 does not replace the current creator/reviewer UI because Firebase Auth is not yet canonical there. When the flag is disabled, `Vs1WorkflowRepository` remains the functional-local workflow. When enabled by a future integration task, Firebase RouteVersion/Review state is authoritative; implementations must not silently fall back after a trusted operation fails.

## Security Rules

- Route/version trees and public version stations are readable only by active same-organization route/team authorities and organization teachers under the current MVP policy.
- AnswerKeys/protected trigger records are server-only.
- Creators and authorized teachers may read exact Reviews; organization teachers may query the pending queue.
- All client create/update/delete operations for RouteVersion, version stations, protected records, and Reviews are denied.
- Existing Route Rules still prevent client changes to status and version pointers. Workflow mutation occurs only through Admin SDK transactions.

## Implementation truth

### REAL / FIREBASE (implemented and emulator-tested, not deployed)

- Immutable RouteVersion content snapshots and version station snapshots.
- Protected task-answer and trigger-secret storage.
- Exact-version Reviews.
- Trusted submit, Request Changes, resubmit, and approve operations.
- Transaction concurrency/state guards and callable auth boundary.
- Read repositories for pending Reviews, creator route Reviews, exact versions, and exact version stations.

### FUNCTIONAL LOCAL

- Existing local VS1 workflow remains available when the Firebase workflow flag is disabled.
- RouteSession, Participation, TaskResponse, progress, and scoring remain local.

### LEGACY / MOCK

- Mock login/user switching, local `dataService` compatibility, and prototype content.

### NOT MIGRATED

- RouteSession, Participation, TaskResponse, scoring/evaluation, evidence/Storage, participant execution, PWA/offline, marketplace/discovery, or deployment.

## Validation

Run trusted workflow tests with:

```powershell
npm.cmd run test:workflow
```

Run client Rules tests with:

```powershell
npm.cmd run test:rules
```

The workflow suite uses the Firestore emulator and Admin SDK transaction implementation. The Rules suite verifies client immutability and protected-data denial independently.

## Task 7 boundary

The next migration should move RouteSession and Participation persistence, followed by TaskResponse/trusted scoring as its own security-sensitive step. It must bind sessions permanently to approved RouteVersions and must not expose the protected records introduced here.
