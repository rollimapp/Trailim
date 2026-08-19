# Trailim Firebase Foundation

## Current status

Task 4 introduces the first Firebase-backed infrastructure boundary. The repository previously had no Firebase SDK initialization, emulator configuration, Firestore Rules, or Firebase persistence. No Firebase project is selected in this repository and no `.firebaserc` is committed. Nothing in this task deploys or writes to a production Firebase project.

The client initializes Firebase lazily through `src/services/firebase/firebaseClient.ts`. It reuses an existing app instance during HMR/tests and connects to Auth and Firestore emulators only when Vite is in development mode and `VITE_USE_FIREBASE_EMULATORS=true`. Emulator connection is guarded across HMR reloads.

## Environment variables

Copy `.env.example` to a git-ignored local environment file and replace placeholders with a Firebase web app configuration:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_USE_FIREBASE_EMULATORS
```

Firebase web configuration identifies a project but is not authorization authority. Do not put service-account keys, Admin SDK credentials, or other secrets in Vite variables. No real credentials are committed.

## Local emulators

Prerequisites are Node.js and a Java runtime supported by the Firebase Emulator Suite.

```powershell
npm.cmd run emulators
```

This starts Auth on `127.0.0.1:9099`, Firestore on `127.0.0.1:8080`, and the Emulator UI on port `4000`. Set `VITE_USE_FIREBASE_EMULATORS="true"` in the local Vite environment when running the app against them.

Run the focused Rules suite with:

```powershell
npm.cmd run test:rules
```

The test command starts a temporary Firestore emulator, runs `firestore.rules.test.mjs`, and stops the emulator. It does not require or select a production project.

## Collections introduced

- `/organizations/{organizationId}` stores canonical `Organization` documents.
- `/organizations/{organizationId}/memberships/{userId}` stores canonical `OrganizationMembership` documents. The document ID is the Firebase Auth UID.
- `/teams/{teamId}` stores canonical `Vs1Team` documents.
- `/teams/{teamId}/members/{userId}` stores canonical `TeamMember` documents. The document ID is the Firebase Auth UID while the canonical `id` field remains `${teamId}_${userId}`.

Firestore converters keep Firebase `Timestamp` values out of the domain types and expose the existing ISO-string timestamp fields. Team creation and membership creation use server timestamps. The only composite index added supports the implemented teams-by-organization ordered query.

## Repository boundary

- `FirestoreOrganizationRepository` reads organization records.
- `FirestoreMembershipRepository` reads a user's membership and teacher-authorized membership lists.
- `FirestoreTeamRepository` creates, reads, lists, and performs constrained updates for teams and team members.

UI components do not call Firestore directly. The existing local VS1 repository is retained and remains the active prototype path.

Organization and organization-membership provisioning is intentionally not exposed as an ordinary client repository write. Task 4 Rules deny those client writes; a future trusted administrative operation or controlled bootstrap must create and change membership authority.

## Authority model

Firebase Auth identifies a user by UID. It does not grant a Trailim organizational role. `/organizations/{organizationId}/memberships/{uid}` determines whether that identity is an active Student or Teacher in the organization.

- Unauthenticated users cannot access Task 4 data.
- Active organization members can read their organization and teams in that organization.
- A user can read their own membership; organization teachers can read the organization membership list.
- Clients cannot create or modify organization memberships, so they cannot self-promote Student to Teacher.
- Active members can create a team for themselves. The creator, an active team manager, or an organization teacher can manage that team's membership.
- Team/member organization and identity fields are validated against document paths and parent documents.
- All other collections and operations are denied by default.

The Rules tests use independent organizations and users and cover unauthenticated access, own-membership reads, cross-organization denial, role escalation denial, team boundaries, unauthorized self-add, the authorized MVP team flow, and malformed identity denial.

## Implementation truth

### REAL / FIREBASE

- Lazy Firebase app initialization for Auth and Cloud Firestore.
- Optional local Auth/Firestore emulator connection.
- Firebase Auth identity observation adapter. It is not yet wired over the prototype login UI.
- Firestore repositories and Rules for Organization, OrganizationMembership, Team, and TeamMember.
- Firestore Rules emulator tests for the Task 4 authorization boundary.

### FUNCTIONAL LOCAL

- Current VS1 Route, RouteDraft, RouteVersion, and Review workflow.
- RouteSession, Participation, TaskResponse, progress, and local scoring.
- Mock login/user switching remains the active UI flow.

### LEGACY / MOCK

- `dataService` localStorage fallbacks, prototype content, and unrelated mock domain services.

### MODELED / NOT YET MIGRATED

- Route and RouteDraft Firestore persistence.
- RouteVersion snapshot submission and protected AnswerKey storage.
- Review decisions and approval transactions.
- RouteSession, Participation, TaskResponse, trusted scoring, and progress persistence.
- Storage/evidence, QR/passcode protection, GPS, PWA/offline, marketplace, AI, and deferred product entities.
- Trusted organization/membership provisioning and production custom claims, if later required.

## Next recommended migration step

After this foundation is approved, implement Route and RouteDraft Firestore persistence behind a repository boundary, with creator/team ownership Rules and emulator coverage. Keep the local fallback until that slice is working and tested. RouteVersion, Review, session, response, and scoring migration remain separate later tasks.
