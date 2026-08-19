# Trailim Firebase Route and Draft Persistence

## Scope

Task 5 adds Firestore persistence for the mutable Route authoring layer only:

- `/routes/{routeId}` — stable `Vs1Route` identity and protected workflow summary.
- `/routes/{routeId}/drafts/{draftId}` — current `RouteDraft` content without its station array.
- `/routes/{routeId}/drafts/{draftId}/stations/{stationId}` — mutable `RouteStationDraft` authoring documents.

The Firestore adapter reconstructs the canonical `RouteDraft` aggregate by loading its station subcollection. Firestore-only path metadata such as a station's `draftId` is removed when converting back to the domain type. No competing domain model was introduced.

## Repository boundary

`FirestoreRouteDraftRepository` provides:

- atomic creation of a new Route, its current RouteDraft, and draft stations;
- Route reads and implemented organization/team lists;
- title-only Route authoring updates;
- current/full draft reads;
- aggregate draft save, including removal of deleted station documents;
- individual station save/delete operations.

All Firestore calls stay inside the Firebase service layer. `Vs1WorkflowRepository` remains intact for the functional-local workflow.

`getEnabledFirestoreRouteDraftRepository()` exposes the opt-in migration boundary. It returns the Firestore repository only when:

1. Firebase client configuration is complete;
2. `VITE_ENABLE_FIREBASE_ROUTE_DRAFTS=true`; and
3. Firebase Auth has a current user.

Otherwise callers continue using the existing local VS1 path. Task 5 does not wire the mock creator UI into an unauthenticated Firebase write and does not add brittle background dual writes. Once a Firebase Route exists, its Firestore identity and Rules—not local legacy state—are authoritative for this slice.

## Authority and field boundaries

- Route reads require active organization membership.
- Draft and draft-station reads/writes require active organization membership plus authority over the exact owning team.
- Route creation requires an existing team in the same organization and a legitimate active creator/manager/teacher path for that team.
- New routes must start in `draft`, with no submitted or approved version pointers.
- Ordinary Route updates may change only `title` and `updatedAt`.
- `organizationId`, `ownerTeamId`, `createdByUserId`, `createdAt`, `currentDraftId`, status, visibility, `latestSubmittedVersionId`, and `approvedVersionId` cannot be changed by ordinary clients.
- Draft identity must match the parent Route, the Route's current draft, organization, and owner team. `basedOnVersionId` is client-immutable in this task.
- Station `id`, `routeId`, and Firestore `draftId` must match the document path and current draft.
- Inactive organization members lose creator and team-manager authority immediately.
- Deletes of Route and RouteDraft documents are denied in this task; authorized station deletion remains part of normal authoring.

Organization teachers retain the Task 4 policy authority to manage teams in their organization. Random same-organization students and managers of unrelated teams cannot edit another team's route or draft.

## Direct-submit compatibility

`createRouteWithDraft()` uses one Firestore batch to establish the Route, current RouteDraft, and draft stations. This supports the approved future flow:

```text
create → author → submit
```

without requiring a separate manual Save Draft action. Trusted submission is not implemented here; Task 6 must read this coherent persisted draft and atomically create the immutable version/review workflow.

## Implementation truth

### REAL / FIREBASE

- Organization, OrganizationMembership, Team, and TeamMember foundation from Task 4.
- Route identity and safe authoring summary updates.
- RouteDraft metadata/content and mutable draft stations.
- Firestore converters with timestamp and path-identity validation.
- Rules and emulator coverage for ownership, inactive membership, immutable workflow fields, direct creation, and path identity.

### FUNCTIONAL LOCAL

- RouteVersion snapshots and protected AnswerKeys.
- Reviews, changes requested, resubmission, and approval.
- RouteSession, Participation, TaskResponse, progress, and local scoring.
- Existing creator/review/participant prototype flows.

### LEGACY / MOCK

- `dataService` localStorage fallbacks, mock login/user switching, and prototype content.

### NOT MIGRATED

- RouteVersion and immutable station snapshots.
- AnswerKeys or protected QR/access-code data.
- Review records or trusted submission/approval operations.
- RouteSession, Participation, TaskResponse, scoring, Storage/evidence, or deployment.

## Task 6 boundary

Task 6 should implement trusted submit, request-changes, resubmit, and approve operations. Those operations must atomically create immutable version data and Reviews while updating the protected Route workflow fields that Task 5 intentionally prevents clients from writing. It must preserve AnswerKey separation and use Rules emulator tests; Task 5 Rules must not be loosened to simulate that authority on the client.
