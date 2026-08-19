# Trailim Pre-Firebase Validation

## 1. Executive verdict

**READY WITH FIXES.** Tasks 1–3 establish a coherent local VS1 contract and the minimum creator, review, session, participation, and response flows can be mapped to Firestore without redesigning the prototype. This pass fixed two blocking local state-machine gaps: duplicate submission while a route is already in review, and reopening a terminal session. Firebase work must still introduce trusted authorization, atomic operations, and server-side evaluation before the local repositories can be treated as production behavior.

Validation scope was the canonical contract and adapters in `src/types/vs1.ts` and `src/services/vs1Adapters.ts`, the versioned workflow in `src/services/vs1WorkflowRepository.ts`, the session layer in `src/services/vs1SessionRepository.ts`, and their minimum UI integrations. The existing legacy data service remains a compatibility layer, not a production design.

## 2. Confirmed invariants

- Route identity is separate from mutable content: `Vs1Route` owns identity and workflow summary fields while `RouteDraft` owns editable `content` and station data.
- `createRouteVersionSnapshot()` copies participant-visible route/station/task content from one coherent `RouteDraft`. Legacy stations are used only to recover protected answer data and mismatches are rejected.
- Submitted `Vs1RouteVersion` and `RouteStationSnapshot` records are append-only in the local workflow. Resubmission creates a new version and leaves V1 unchanged.
- Every `Review` is bound to an exact `routeVersionId`. Versioned review preview uses that snapshot rather than the mutable legacy route.
- A route cannot create a second pending submission by calling `submitDraft()` while already `in_review`; `resubmit()` is allowed only after `requestChanges()`.
- Approval targets the latest pending version and updates `approvedVersionId`, `latestSubmittedVersionId`, and route status consistently.
- `Vs1RouteSession` is permanently bound to one approved `routeVersionId`, `routeId`, and `organizationId`. Repeated sessions receive distinct IDs.
- `Participation` and `Vs1TaskResponse` are session-bound. The same user and route version in separate sessions cannot share progress or responses.
- Auto-resume requires the requested `ExperienceMode` to match the parent session mode.
- Completed and cancelled sessions are terminal. Participant progress, response, completion, and abandonment writes are rejected after session termination.
- Participant snapshots and participant-state reads do not include `AnswerKey`, correct option flags, accepted answers, or scoring controls.

## 3. Blocking issues

No unresolved blocker was found in the local VS1 contract after the focused fixes in this pass.

The following remain blockers to declaring a Firebase-backed slice production-ready, but are implementation work rather than reasons to redesign the contract:

- Firestore Rules and emulator tests must enforce organization membership, team ownership, role checks, and participant scoping.
- Submit, review decisions, approval, session joining, and authoritative scoring need trusted atomic operations.
- Protected trigger secrets for code/QR validation are currently stripped from participant snapshots but are not represented in protected version data. They must be modeled before those trigger types become part of the Firebase slice.

## 4. Non-blocking risks

- `src/services/dataService.ts` and several UI paths still mirror status/progress into legacy localStorage for prototype compatibility. A failed dual write can temporarily make legacy UI state disagree with canonical state.
- LocalStorage has no cross-client concurrency control. The repositories demonstrate transitions but cannot prove transaction behavior.
- Local response evaluation in `Vs1SessionRepository.submitTaskResponse()` reads protected keys in the same client process. This is functional-local only; production evaluation must run in a trusted environment.
- `displayPoints` remains participant-visible by design and is informational, not scoring authority.
- Local identifiers and timestamps are injectable/testable but are not a substitute for server-generated IDs and server timestamps.
- Existing build warnings about CSS import order and large bundles are unrelated to the VS1 domain contract.

## 5. Required pre-Firebase fixes

Completed in this pass:

1. `Vs1WorkflowRepository.submitDraft()` now accepts only a persisted canonical route in `draft`; the creator flow establishes that draft route automatically for a brand-new direct submission, while the internal submission operation remains available to `resubmit()` only after its existing `changes_requested` guard.
2. `Vs1SessionRepository.updateSessionStatus()` now enforces legal forward transitions and makes `completed`/`cancelled` terminal. `abandonParticipation()` now uses the same writable-parent-session gate as other participant writes.
3. Focused regression tests cover duplicate pending submission and irreversible terminal sessions.

Required as part of the Firebase implementation, before enabling the affected production flow:

1. Add protected versioned storage for access-code/QR trigger verification data before enabling those triggers.
2. Move answer evaluation, points, aggregate score, and completion authority out of participant clients.
3. Add Rules emulator tests before replacing any mock fallback.

## 6. Firestore collection map

| Path | Canonical records | Primary access and lookup notes |
| --- | --- | --- |
| `/organizations/{organizationId}` | Organization identity | Authenticated members read; trusted administrators write. |
| `/organizations/{organizationId}/memberships/{userId}` | Minimum organization membership and Student/Teacher role | User may read own membership; teacher/admin queries need role index; only trusted administration writes roles. |
| `/teams/{teamId}` | `Vs1Team` | Organization members read as allowed; authorized teacher/team owner writes. Query by `organizationId`. |
| `/teams/{teamId}/members/{userId}` | `TeamMember` | Members read within organization; trusted teacher/team management writes. Query by user and active status may require a collection-group index. |
| `/routes/{routeId}` | `Vs1Route` identity and workflow summary | Team creators and authorized teachers read; draft owners edit allowed summary fields; workflow pointers change only with trusted workflow operations. Index by `organizationId`, `ownerTeamId`, `status`. |
| `/routes/{routeId}/drafts/{draftId}` | `RouteDraft` metadata/content | Owning team edits current draft; reviewers do not mutate. Station documents may be nested below the draft if document size requires it. |
| `/routes/{routeId}/drafts/{draftId}/stations/{stationId}` | Editable draft stations/tasks | Same authority as draft. Never participant-readable merely because a route is submitted. |
| `/routes/{routeId}/versions/{routeVersionId}` | Immutable `Vs1RouteVersion` | Participants may read only approved/visible versions they are entitled to; creators/reviewers read; only trusted submit operation creates. |
| `/routes/{routeId}/versions/{routeVersionId}/stations/{stationId}` | Immutable `RouteStationSnapshot` with `TaskPublic` | Participant-readable only through approved version/session authorization; trusted submit operation creates; no updates. |
| `/routes/{routeId}/versions/{routeVersionId}/answerKeys/{taskId}` | `AnswerKey` and future protected trigger data | Never participant-readable or writable. Authorized reviewers may read only if product policy requires it; trusted submission/evaluation writes. |
| `/reviews/{reviewId}` | `Review` bound to route/version/org | Organization teacher queue reads; submit operation creates; trusted teacher decision operation updates. Index by `organizationId`, `status`, `submittedAt`; unique pending review is enforced transactionally, not by Rules alone. |
| `/routeSessions/{sessionId}` | `Vs1RouteSession` | Authorized teacher creates/manages; entitled participant reads/join operation reads. Index by route version, mode, status. |
| `/routeSessions/{sessionId}/participations/{participationId}` | `Participation` | Participant reads own record; teacher reads session roster; trusted join/progress/completion operations write controlled fields. Enforce one participation per user/session with a deterministic ID or transaction. |
| `/routeSessions/{sessionId}/participations/{participationId}/responses/{responseId}` | `Vs1TaskResponse` | Participant reads own sanitized results and submits answer input; evaluation fields are server-only. Query stays scoped to participation/session. |

Prefer subcollections for immutable stations, answer keys, participations, and responses to avoid document size limits and to make security boundaries explicit. Denormalized `organizationId`, `routeId`, and `routeVersionId` fields remain necessary for Rules checks and collection-group queries; Rules must verify they agree with parent records.

## 7. Security authority matrix

| Operation/entity | Participant/student | Creator/team | Teacher/reviewer | Trusted server |
| --- | --- | --- | --- | --- |
| User profile | Read/update own safe profile fields | Same | Read organization-visible profile fields | Set protected claims if used |
| Organization membership | Read own | Read permitted membership | Read organization roster | Create/update roles and status |
| Team and TeamMember | Read own teams | Edit owned team within policy | Create/manage assigned teams | Enforce privileged membership changes if needed |
| Route/RouteDraft | No unpublished route access unless creator | Create/edit current team draft | Read for review; no direct draft mutation | Maintain protected workflow summary pointers |
| RouteVersion/stations | Read approved version through visibility/session | Read own submissions; never mutate versions | Read exact submitted snapshot | Atomically create immutable snapshot |
| AnswerKey/protected triggers | No access | No participant-client access; authoring UI should use a separately authorized path | Optional review read only | Persist and evaluate protected data |
| Review | No general queue access | Read own route review outcome | Read queue and request changes/approve | Validate role and atomically apply decision |
| RouteSession | Join/read entitled session | No implicit authority | Create, complete, cancel assigned sessions | Verify approved version and valid transitions |
| Participation | Read own | No implicit authority | Read assigned session roster | Enforce join uniqueness, progress/completion invariants |
| TaskResponse | Submit answer and read own sanitized result | No scoring authority | Read permitted results | Evaluate answer, award points, update aggregate score |

Rules must use membership documents or verified claims, not client-provided role strings. All writes carrying duplicated IDs must validate parent identity and organization consistency.

## 8. Atomicity/transaction matrix

| Operation | Required production primitive | Records that must agree |
| --- | --- | --- |
| Save draft | Client batch or transaction, protected by Rules | Route current draft pointer, draft, and draft stations where applicable |
| Submit draft | Callable/trusted server transaction plus batch | Verify draft ownership/status; allocate version number; create version/stations/protected data/review; set route `in_review` and latest pointer |
| Request changes | Trusted teacher transaction | Pending review, exact version status, route latest pointer/status |
| Resubmit | Callable/trusted server transaction plus batch | Verify `changes_requested`; create a new immutable version/review; preserve prior versions; update route pointer/status |
| Approve version | Trusted teacher transaction | Latest pending review/version and route approved/latest pointers |
| Create session | Trusted operation or transaction | Verify exact version is approved and route/org IDs match; create independent session |
| Join session | Transaction | Verify session open/active and entitlement; create or return one participation for user/session; activate session if needed |
| Submit response | Trusted evaluation transaction | Validate participation/session/version/station/task; create response; award points without exposing key |
| Update progress/complete | Transaction or trusted function | Verify writable session and participation; update progress/score/timestamps without regressing terminal state |
| Complete/cancel session | Trusted teacher transaction | Forward-only session status; reject subsequent participant writes |

Firestore Rules alone cannot guarantee uniqueness across queries, monotonic version allocation, or multi-document workflow consistency. Use deterministic IDs where suitable and transactions/functions for the rest.

## 9. Legacy migration boundary

Keep the current legacy keys and fallback reads during the first Firebase slice:

- Legacy prototype: `trailim_routes_v1` plus existing station, review, progress, session, notification, and domain mock keys managed by `src/services/dataService.ts` and related services.
- Canonical functional-local: `trailim_vs1_versioned_workflow_v1`, `trailim_vs1_teams_v1`, and `trailim_vs1_sessions_participations_v1`.

During migration, canonical Firebase records become authoritative only for the vertical slice explicitly moved. Legacy writes may remain as UI compatibility mirrors, but must not decide authorization, approval, version identity, session identity, scoring, or completion. Reads should prefer the canonical source and use legacy fallback only when no canonical record exists. Remove each legacy fallback only after its Firebase replacement and Rules/emulator coverage are working.

Do not bulk migrate unrelated places, assets, health, adoption, challenge, notification, PWA, or deferred domain models in this slice. Do not infer canonical approval/version records from mutable legacy status after Firebase authority begins.

## 10. Recommended Firebase implementation order

1. Add Firebase configuration for local development and Auth/Firestore emulators; define converters for the existing VS1 types without changing UI behavior.
2. Implement organization membership, team, and TeamMember persistence plus Rules and emulator tests. This establishes every later authorization check.
3. Persist Route and RouteDraft/stations; keep current local fallback and verify creator/team ownership Rules.
4. Implement trusted submit, request-changes, resubmit, and approve operations with immutable version/protected-data writes and transaction tests.
5. Switch versioned creator/review reads to Firestore behind the repository boundary while retaining legacy-only review behavior and fallback.
6. Persist RouteSession and Participation with approved-version validation, mode-aware resume, deterministic/transactional join, and terminal lifecycle Rules tests.
7. Implement trusted TaskResponse evaluation and aggregate progress/score updates; expose only participant-safe response projections.
8. Exercise the complete Student-to-Teacher-to-Participant slice in emulators, then remove only the redundant fallback paths covered by that slice. Production deployment remains a separate approved task.
