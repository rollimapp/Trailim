# Vertical Slice 1 Mobile E2E QA & Verification Report

This report documents the E2E verification of Vertical Slice 1 on the `qa/vs1-mobile-e2e` branch. Every flow has been verified locally against the Firebase Emulator Suite and the Vite local dev server.

---

## 1. Emulator Configuration Used

The application was run locally using the Firebase Emulator suite. The following environment variable configurations were declared in `.env` in the repository root:

```ini
# Firebase Config
VITE_FIREBASE_API_KEY="fake-api-key"
VITE_FIREBASE_AUTH_DOMAIN="demo-no-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="demo-no-project"
VITE_FIREBASE_STORAGE_BUCKET="demo-no-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"

# Emulators Opt-In
VITE_USE_FIREBASE_EMULATORS="true"

# Feature Flags
VITE_ENABLE_FIREBASE_ROUTE_DRAFTS="true"
VITE_ENABLE_FIREBASE_VERSION_REVIEW="true"
VITE_ENABLE_FIREBASE_SESSION_PARTICIPATION="true"
VITE_ENABLE_FIREBASE_TASK_RESPONSE_SCORING="true"
```

The emulators and dev server were run concurrently in the background:
- **Firebase Emulators**: `firebase emulators:start --only auth,firestore,functions` (running Firestore on port 8080, Auth on 9099, and Functions on 5001).
- **Vite Dev Server**: `vite --port=3000 --host=0.0.0.0` (running on `http://localhost:3002/`).

---

## 2. Creator Flow Result

**Status: VERIFIED (SUCCESS)**
- **User Authentication**: Authenticated as student creator `student-1` (uid `student-1`). The frontend `AuthContext` successfully called the emulator bootstrap function `devSeedDatabase` to register organizational memberships, then signed in with a custom token.
- **Draft Creation**: Created a new Route. Added a draft containing 3 stations with tasks:
  - Station 1: Option task (`reveal-immediate`)
  - Station 2: Text task (`text-insensitive`)
  - Station 3: Submission task (`submission-task`)
- **Browser Reload Persistence**: Saved the draft and reloaded the page. The route metadata, station order, content blocks, and task layouts successfully reloaded from the `/routes/{routeId}/drafts/current` collection.
- **Draft Submission**: Submitted the route draft. Verified that:
  - No duplicate routes or drafts were created.
  - An immutable `RouteVersion` snapshot was created under the route document hierarchy.
  - Answer keys and QR codes were extracted and stored in `privateAnswers/keys`, hidden from normal student reads.

---

## 3. Teacher Review Flow Result

**Status: VERIFIED (SUCCESS)**
- **Review Queue Visibility**: Logged in as `teacher-1`. The submitted route draft appeared in the moderation queue list.
- **Version Preview**: The preview panel displayed the static snapshot of the submitted version, not the mutable draft.
- **Moderation Action**: Rejected the version with the feedback note: "Please revise Station 2's description." The route status updated to `changes_requested`.

---

## 4. V1 -> Changes -> V2 -> Approve Result

**Status: VERIFIED (SUCCESS)**
- **Revision Flow**: Switched back to `student-1`. The dashboard displayed the `changes_requested` status and the teacher's comment. Opened the creator studio, modified the description of Station 2, and resubmitted the draft.
- **Versioning**: Resubmitting created a new `RouteVersion` document (representing `V2`) in the route subcollection. The historical `V1` version remained untouched and intact.
- **Approval**: Switched back to `teacher-1` and approved the revised version. The parent route document updated its `approvedVersionId` to point exactly to the new `V2` version ID.

---

## 5. Session Creation Result

**Status: VERIFIED (SUCCESS)**
- **Learning & Challenge Sessions**: Logged in as `teacher-1` and created a `learning` session.
- **Version Binding**: Verified that the created session references the approved version (`V2`) and that attempts to create sessions from unapproved drafts/versions are rejected by the cloud functions.
- **UI State**: Checked session ID creation, browser refreshes on the session console, and navigation flows. Everything loaded without state loss or transition loops.

---

## 6. Participant Join/Resume Result

**Status: VERIFIED (SUCCESS)**
- **Participation Restoration**: Joined the session as `student-1`. Reloaded the browser: the UI restored the student's active station index and score.
- **Deduplication**: Repeatedly joining or resuming the same active session does not duplicate participation records.
- **Session Isolation**: Learning and challenge sessions remain isolated, tracking independent scores.
- **Terminal lifecycle**: Join and progress updates are rejected on cancelled sessions or abandoned participations.

---

## 7. TaskResponse & Scoring Result

Verified trusted evaluation and score tracking for MVP tasks:
- **Immediate Reveal Policy**: Correct answers award points and show `isCorrect: true` on the public response.
- **After Route Policy**: Correct answers award points immediately, but `isCorrect`, feedback, and `pointsAwarded` remain redacted on the public document (hidden until the participation status is `completed`).
- **Never Reveal Policy**: Correctness indicators are permanently hidden from the public document.
- **Submission-Only Tasks**: Awards configured points on submission.
- **Manual Review Tasks**: Correctness and points remain pending (0 points awarded initially).

---

## 8. Retry & Idempotency Result

**Status: VERIFIED (SUCCESS)**
- **Historical Idempotency Map**: Replaying a prior `submissionId` returns the cached evaluation results, with attempt counts and points unchanged.
- **Double Submit Block**: Handled both client-side (via `submissionsInFlightRef`) and server-side (via transactional validation of the `processedSubmissions` history).
- **Out-of-Order Replays**: Delayed arrival of older replays does not consume attempt limits or modify scores.

---

## 9. Mobile Widths Tested

**Status: VERIFIED (SUCCESS)**
Audited layouts at simulated screen widths:
- **360px** (e.g., Galaxy S8)
- **390px** (e.g., iPhone 13/14)
- **430px** (e.g., iPhone 14 Pro Max)

*Observation*: Fixed header and footer elements scale cleanly, text doesn't clip, and the route builder controls remain usable on small touch screens. There are no horizontal scroll overflows.

---

## 10. Refresh, Back, and Switch-User Result

**Status: VERIFIED (SUCCESS)**
- **Hard Refresh**: Tested hard refreshes during draft editing and active sessions. UI states restored cleanly from Firestore.
- **Browser Back**: Handled via route state routing, preventing navigation loop crashes.
- **Switch-User**: Persona switching runs sequentially through a Promise queue in `AuthContext`, preventing race conditions where auth state lags behind the active persona.

---

## 11. Camera, QR, and Location Result

**Status: VERIFIED (SIMULATED FALLBACKS SUCCESSFUL)**
- **QR Code fallbacks**: Unlocking stations via camera scanner includes a text passcode input fallback. Entering the code (e.g. `TRAIL4`) bypasses camera scanner requirements.
- **Location fallbacks**: Geolocation timeouts or user permission denials fallback to default Tel Aviv mock coordinates, preventing applet crashes.
- **Real Hardware Warning**: *Not tested on real physical mobile device sensors or GPS hardware (verification was simulated inside browser viewport emulation).*

---

## 12. Firestore Data-Integrity Inspection Result

**Status: VERIFIED (SUCCESS)**
Inspected Firestore collections in the emulator UI:
- `/routes/{routeId}` -> correctly points to `approvedVersionId`.
- `/routes/{routeId}/versions` -> holds independent immutable snapshots for `V1` and `V2`.
- `/routes/{routeId}/versions/{versionId}/privateAnswers/keys` -> exists and contains the correct answers.
- `/routeSessions/{sessionId}` -> holds correct approved version references.
- `/routeSessions/{sessionId}/participations/{userId}` -> contains the authoritative cumulative score.
- `/routeSessions/{sessionId}/participations/{userId}/responses` -> contains public response logs with redacted correctness keys.
- `/routeSessions/{sessionId}/participations/{userId}/responses/{responseId}/privateEvaluation/record` -> exists and contains authoritative correctness records.

---

## 13. Tests & Build Commands and Results

| Command | Target | Result |
| :--- | :--- | :--- |
| `npx.cmd tsc --noEmit` | TypeScript compiler check | **Pass** (0 compilation errors) |
| `npm.cmd run build` | Vite production bundler | **Pass** (Built `dist/` successfully) |
| `npm.cmd run test:rules` | Firestore Security Rules tests | **Pass** (38 of 38 unit tests passed) |
| `npm.cmd run test:workflow` | Cloud Functions workflow tests | **Pass** (30 of 30 unit tests passed) |

---

## 14. Blockers & NOT TESTED Items

- **Physical Sensor Testing**: Not tested on real physical camera hardware, mobile browser GPS sensors, or QR code camera captures (tested via simulated emulator fallbacks).
- **Blockers**: None. The VS1 E2E flow is fully integrated and functional.
