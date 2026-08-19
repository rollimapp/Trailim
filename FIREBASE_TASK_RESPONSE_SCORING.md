# Trailim Firebase TaskResponse and Trusted Scoring

## Scope

Task 8 adds trusted TaskResponse evaluation under:

`/routeSessions/{sessionId}/participations/{userId}/responses/{responseId}`

The callable `submitTaskResponse(sessionId, stationId, taskId, answer)` derives participant, participation, route, version, evaluation, points, attempts, and score from Firebase Auth and canonical Firestore records. The client cannot supply scoring authority.

## Identity and atomicity

There is one deterministic response document for each participation/station/task. Its ID is the base64url encoding of the JSON pair `[stationId, taskId]`, avoiding delimiter collisions. A transaction reads the exact session, caller participation, immutable RouteVersion/station/task, protected AnswerKey, and previous response before writing.

The atomic score formula is:

`nextScore = max(0, currentScore - previousAwardedPoints + newAwardedPoints)`

This replaces a prior award instead of blindly incrementing it. Concurrent requests conflict on the deterministic response and participation documents; they cannot create a second logical response or award the same points twice.

## Evaluation and retries

- `option_ids` accepts the existing single-ID client shape or an ID array, normalizes to an array, rejects duplicates/unknown public option IDs, and compares answer/correct IDs as sets.
- `accepted_text` requires a string and performs exact comparison with the protected `caseSensitive` setting. It does not trim or use fuzzy matching, matching the local semantics.
- `submission_only` is evaluated without automatic correctness and awards the configured protected points.
- `manual_review` stores `evaluationStatus = manual_review`, no correctness, and zero points. Teacher manual grading remains a follow-up slice.

The server owns `attemptCount`, `allowRetry`, `attemptLimit`, and `penaltyPerAttempt`. A correct retry award is `max(0, configuredPoints - penaltyPerAttempt * (attemptCount - 1))`. Incorrect and manual-review submissions award zero. Attempts beyond policy fail inside the transaction.

## Security boundary

Participants can read only their own responses. Active organization teachers may read session responses. Unrelated and cross-organization clients are denied. Every client response write is denied, Participation score remains client-immutable, and protected AnswerKeys remain unreadable.

`VITE_ENABLE_FIREBASE_TASK_RESPONSE_SCORING=true` opts an authenticated Firebase session slice into the callable gateway. No silent fallback is allowed after an enabled Firebase call fails. When disabled, the existing local VS1 response/evaluation prototype remains functional.

## Implementation truth

### REAL / FIREBASE (emulator-tested, not deployed)

- TaskResponse persistence and deterministic identity.
- Protected AnswerKey evaluation.
- Server-enforced retries, attempts, penalties, correctness, and points.
- Atomic Participation score replacement by delta.
- Own-response and teacher-summary read Rules.

### FUNCTIONAL LOCAL / NOT MIGRATED

- Existing local response/evaluation fallback.
- Teacher manual grading/point award.
- XP, account progression, leaderboards, analytics, multiplayer scoring, evidence/media, and offline/PWA behavior.

## Next boundary

Manual teacher grading, if required for the MVP, must be a separate trusted operation. XP and leaderboard progression must not derive authority from participant-writable data and remain outside Task 8.
