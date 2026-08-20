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
- **Completion**: Completing the route updates progress and score values on the participation document.

---

## 6. Manual Task Response Tests

**Status: MANUALLY VERIFIED**
- **Immediate Reveal Policy**: Correct option awards 10 points and sets `isCorrect: true` on the public response document. Incorrect awards 0. Retrying correct awards 8 points (subtracting 2 points penalty per attempt).
- **After-Route Policy**: Answer submitted successfully and score updated, but correctness data (`isCorrect`, `feedback`, `pointsAwarded`) remains redacted from the public task response document. It is stored inside `/privateEvaluation/record` and is readable only after participation status becomes `completed`.
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

---

## 11. Verification & Build Results

| Command | Target | Result |
| :--- | :--- | :--- |
| `npx.cmd tsc --noEmit` | TypeScript compiler check | **Pass** (0 compilation errors) |
| `npm.cmd run build` | Vite production bundler | **Pass** (Built `dist/` successfully) |
| `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; node --test firestore.rules.test.mjs` | Firestore Security Rules tests | **Pass** (41 of 41 unit tests passed) |
| `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"; npm.cmd run test --prefix functions` | Cloud Functions workflow tests | **Pass** (30 of 30 unit tests passed) |
| `npx.cmd playwright test vs1-browser.spec.js --timeout 90000` | Playwright Browser E2E suite | **Pass** (2 of 2 tests passed) |

---

## 12. Blockers & NOT TESTED Items

- **Physical Sensor Testing**: Not tested on real mobile camera or GPS sensors (tested via simulated browser fallbacks).
- **Challenge Session E2E**: Not manually tested in browser UI E2E (backend integration and scoring calculations only).
- **Blockers**: None.
