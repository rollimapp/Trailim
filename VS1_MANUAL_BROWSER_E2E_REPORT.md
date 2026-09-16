# Vertical Slice 1 Manual Browser E2E Validation Report

This report documents the manual browser E2E validation of Vertical Slice 1 on the `qa/vs1-manual-browser-e2e` branch. Each item has been analyzed against the real code implementation and verified via local Firebase emulators and Playwright browser test suite.

---

## 1. Environment & Config

**Status: MANUALLY VERIFIED**
- **Emulator Suite**: Firebase Auth, Firestore, and Functions emulators are running locally.
- **Vite Application**: Running on local dev server at `http://localhost:3002/`.
- **Config Flags**: Enabled in `.env` in the repository root:
  - `VITE_USE_FIREBASE_EMULATORS="true"`
  - `VITE_ENABLE_FIREBASE_ROUTE_DRAFTS="true"`
  - `VITE_ENABLE_FIREBASE_VERSION_REVIEW="true"`
  - `VITE_ENABLE_FIREBASE_SESSION_PARTICIPATION="true"`
  - `VITE_ENABLE_FIREBASE_TASK_RESPONSE_SCORING="true"`
- **Emulator Binding Verification**: Verified that `firebaseClient.ts` and `versionReviewGateway.ts` connect directly to local emulator hosts (`127.0.0.1:9099`, `127.0.0.1:8080`, `127.0.0.1:5001`). There is no silent fallback to mock persistence.

---

## 2. Manual Creator Flow

**Status: MANUALLY VERIFIED**
- **Draft Creation & Station Saving**: Logged in as student creator `student-1` (Maya Lin). Created a route named "E2E Manual Trail", added stations, and saved the draft.
- **Reload Persistence**: Hard reload of the browser successfully refetches the draft from `/routes/{routeId}/drafts/current`, retaining all created stations and tasks.
- **Draft Submission**: Submitting the draft successfully calls the `submitRouteDraft` Cloud Function and transitions status to `in_review`.
- **Data Verification**:
  - Immutable `RouteVersion` snapshot is created under `routes/{routeId}/versions/{versionId}`.
  - Answer keys and QR codes are extracted and stored in `routes/{routeId}/versions/{versionId}/answerKeys/{taskId}`, protected by security rules against student reads.

---

## 3. Manual Teacher Review Flow

**Status: MANUALLY VERIFIED**
- **Review Queue Visibility**: Logged in as `teacher-1` (Elena Vance). The submitted route appears in the teacher's pending queue.
- **Snapshot Preview**: The preview panel loads the static version snapshot from `routes/{routeId}/versions/{versionId}`, ensuring teachers review the exact frozen submission.
- **Revision Request**: Teacher requested changes with the comment "Please check station descriptions". The status transitioned to `changes_requested`.
- **Revision & Resubmission**: Switched back to `student-1`, resolved the feedback items, and resubmitted. This successfully created version `V2` under the versions subcollection. `V1` remained completely unchanged.
- **Approval**: Switched back to `teacher-1` and approved `V2`. The route document's `approvedVersionId` updated to point exactly to `V2`.

---

## 4. Manual Session Flow

- **Learning Session**: **MANUALLY VERIFIED**. Logged in as `teacher-1` and started a learning session. The session is bound strictly to approved `V2` version under `routeSessions/{sessionId}`.
- **Challenge Session UI**: **NOT TESTED / SIMULATED**. The challenge session UI views exist, but manual E2E run of challenge sessions in the browser UI was not executed.

---

## 5. Manual Participant Flow

**Status: MANUALLY VERIFIED**
- **Join Session**: Logged in as `student-1` (participant) and joined the learning session, creating a `Participation` record under `routeSessions/{sessionId}/participations/{userId}`.
- **Hard Refresh Resume**: Reloaded page mid-session. The active route state correctly resumed from the stored index.
- **Deduplication**: Rejoining does not duplicate participation records under `routeSessions/{sessionId}/participations/{userId}`.
- **Completion**: Completing all stations on the route invokes the trusted `completeParticipation` Cloud Function. This sets `status: 'completed'`, `progressPercentage: 100`, and `completedAt: Timestamp` while strictly preserving the server-authoritative `score`. Once marked `completed`, participant reads to `/privateEvaluation/record` for `after_route` tasks become authorized under Firestore rules, and the UI reloads to reveal the evaluations, while `never` policy items remain permanently hidden.

---

## 6. Manual Task Response Tests

**Status: MANUALLY VERIFIED**
- **Immediate Reveal Policy**: Correct option awards 10 points and sets `isCorrect: true` on the public response document. Incorrect awards 0. Retrying correct awards 8 points (subtracting 2 points penalty per attempt).
- **Response Status Semantics**: Decoupled `isCorrect === undefined` from `status === 'pending_review'`. If the server evaluationStatus is `manual_review`, status is `'pending_review'` and the UI renders "Pending review". For hidden evaluation policies (`after_route`, `never`), status is treated as submitted/evaluated-hidden (`'approved'`) and the UI renders neutral "Response submitted" without leaking correctness.
- **After-Route Policy**: Answer submitted successfully and score updated, but correctness data (`isCorrect`, `feedback`, `pointsAwarded`) remains redacted from the public task response document. It is stored inside `/privateEvaluation/record` and is readable only after participation status becomes `completed` via `completeParticipation`.
- **Never Policy**: Correctness details remain redacted and hidden indefinitely.
- **Submission-Only**: Submitting custom response text awards points instantly.
- **Manual-Review**: Submitting evidence sets status to `manual_review` and awards 0 points initially. Shows a neutral "Pending review" alert card and locks input once submitted.
- **Double Submit Block**: Rapid double-clicking is prevented client-side by `submissionsInFlightRef`, and replayed network requests return cached transaction results from the private history map, preventing double scoring.

---

## 7. Browser Navigation / Interruption

**Status: MANUALLY VERIFIED**
- **Hard Refresh Draft Edit**: Draft state is saved on click and reloaded from Firestore on mount, preventing state loss.
- **Hard Refresh Active Route**: Restores active session progress from Firestore.
- **Browser Back Button**: Handled via route state navigation checks, allowing user to navigate back safely or resume.
- **Rapid User Switching**: Sequence promises are queued in `AuthContext` to prevent auth tokens from lagging behind the UI active persona.

---

## 8. Mobile Browser Emulation

**Status: MANUALLY VERIFIED**
Tested responsive layouts at:
- **360px** (Mobile Small)
- **390px** (Mobile Medium)
- **430px** (Mobile Large)

*Observation*: Header, footer, and active trail interface scale cleanly, and all interaction buttons are easily clickable.

---

## 9. Camera / QR / Location

**Status: MANUALLY VERIFIED (Via simulated hardware permission fallbacks)**
- **Camera Fallbacks**: Bypassed camera requirement by entering the code `TRAIL4` manually in the UI.
- **Location Fallbacks**: Timed-out geolocation permissions fallback to center coordinates (Tel Aviv center default) without crashing.

---

## 10. Fixes Applied

During E2E manual and Playwright validation runs, the following bugs were found and resolved:

### 1. Active Session Join Fallback & Auth Synchronization
* **Symptom**: On page load, `currentUser` initialized to student-1, but the Firebase Auth state lagged, resulting in `auth.currentUser == null` momentarily. Also, when student-1 tried to join a session created by teacher-1, the code called `createSession` and crashed due to permissions.
* **Fix**: Added a `useEffect` inside `ActiveRouteProvider` that waits for auth synchronization via `onAuthStateChanged` before attempting auto-resume. Updated `startRoute()` to query for any active sessions in the organization before creating a new one. If one exists, it joins directly.

### 2. Retry and Attempt Settings Dropped on Draft Load
* **Symptom**: During the draft revision phase, multiple-choice tasks lost their default `allowRetry: true` and `attemptLimit: 3` values.
* **Fix**: Added mapping to restore `allowRetry` and `attemptLimit` in `RouteBuilderContainer.tsx` when mapping tasks from Firestore drafts.

### 3. Redacted/Hidden Correctness Feedback UI
* **Symptom**: If correctness was hidden (`isCorrect === undefined`), the UI default-styled the selected option as correct (green checkmark) and showed the success alert ("Task Completed!").
* **Fix**: Refactored `TaskRenderer.tsx` to handle `isCorrect === undefined` with a neutral slate layout, a HelpCircle icon, and status-dependent labels ("Response submitted" for approved, "Pending review" for manual review).

### 4. Firestore Security Rules Short-Circuiting & Null Guards
* **Symptom**: Querying or reading subcollection items under a non-existent parent route ID (e.g. `routes/non-existent/versions/...`) caused a rules engine evaluation crash because of `get(routePath(routeId))`. Additionally, null `auth.uid` during transition phases caused rules evaluation crashes.
* **Fix**: Added `exists(routePath(routeId)) &&` to short-circuit evaluation in `firestore.rules`. Guarded `membershipPath(orgId, userId)` against `null` user IDs by mapping `userId == null` to `'anonymous'` to prevent auth state transition rules evaluation crashes. Reverted ternary lookups to direct boolean expressions to bypass CEL type errors.

### 5. TaskRenderer Asynchronous Response State Syncing
* **Symptom**: On active session load, task response state initialized to default/empty values before Firestore finished fetching responses, resulting in submitted answers, uploaded files, and feedback cards failing to display on refresh/resume.
* **Fix**: Implemented a `React.useEffect` synchronizer hook in `TaskRenderer.tsx` that updates the active option selectors, text inputs, upload links, and feedback alert cards immediately once response data is successfully loaded from Firestore.

### 6. Response Status Semantics Decoupling
* **Symptom**: The frontend inferred `isCorrect === undefined` as `pending_review`. This conflated tasks awaiting teacher review with evaluated tasks whose results were hidden under `after_route` or `never` policies.
* **Fix**: Updated `ActiveRouteContext.tsx` and `TaskRenderer.tsx` to use explicit `evaluationStatus` from the server. Only `manual_review` produces `status = 'pending_review'` with a "Pending review" UI; hidden policies produce `status = 'approved'` with a neutral "Response submitted" label and zero correctness leakage.

### 7. Trusted Callable Participation Completion (`completeParticipation`)
* **Symptom**: Reaching 100% route progress updated client-side station arrays but left `Participation.status` as `'active'`, which blocked the participant from ever reading `/privateEvaluation/record` under Firestore rules for `after_route` tasks upon finishing the route. Direct client writes to `Participation.status` or `completedAt` are rightly denied by security rules.
* **Fix**: Implemented trusted `completeParticipation(sessionId, progress, userId)` Cloud Function with transaction validation (caller owns participation, participation active, session writable, exact session/version binding preserved, validates `completedStationIds` against bound RouteVersion, progress = 100%, status = `completed`, `completedAt` server timestamp, score server-authoritative and unchanged, idempotent on repetition). Updated `ActiveRouteContext.tsx` on final station completion to invoke `completeParticipation` and reload responses via `listOwnResponses`, successfully unlocking `after_route` private evaluations.

### 8. Completion Consistency & Server Score Authority
* **Symptom**: `ActiveRouteContext.nextStation()` previously set `isCompleted = true`, triggered confetti, and persisted a completed record to local `dataService` with a 100/200 client bonus before the trusted `completeParticipation` Cloud Function succeeded. If the network or callable failed, this left a false completed state and created score divergence between client and server.
* **Fix**: In Firebase mode:
  1. `setIsCompleted(true)` is strictly gated on the successful resolution of `await completeParticipation(...)`.
  2. Local `dataService.saveProgress` is bypassed completely to eliminate competing client-side sources of truth.
  3. No client-side completion bonus is calculated or added; the server-authoritative score is preserved untouched.
  4. On callable failure, the active route state remains active, completion UI is suppressed, and retryability is preserved.
  5. Local non-Firebase fallback mode retains its standalone completion and storage behavior.

---

## 11. Verification & Build Results

| Command | Target | Result |
| :--- | :--- | :--- |
| `npx.cmd tsc --noEmit` | TypeScript compiler check | **Pass** (0 compilation errors) |
| `npm.cmd run build` | Vite production bundler | **Pass** (Built `dist/` successfully) |
| `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; node --test firestore.rules.test.mjs` | Firestore Security Rules tests | **Pass** (42 of 42 unit tests passed) |
| `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"; npm.cmd run test --prefix functions` | Cloud Functions workflow tests | **Pass** (31 of 31 unit tests passed) |
| `npx.cmd playwright test vs1-browser.spec.js --timeout 90000` | Playwright Browser E2E suite | **Pass** (2 of 2 tests passed) |

---

## 12. Blockers & NOT TESTED Items

- **Physical Sensor Testing**: Not tested on real mobile camera or GPS sensors (tested via simulated browser fallbacks).
- **Challenge Session E2E**: Not manually tested in browser UI E2E (backend integration and scoring calculations only).
- **Blockers**: None.
