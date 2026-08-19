# TRAILIM_ARCHITECTURE.md
## Core entities
- User + Capabilities
- Organization / School
- Team + TeamMember + ContributorRole
- Route
- RouteVersion
- RouteStation
- Place
- KnowledgeAsset
- Task + protected AnswerKey
- RouteSession
- Participation / Progress
- TaskResponse
- Evidence / MediaSubmission
- Review / ReviewComment / RubricResult
- VerificationRecord
- RouteHealthReport / RouteHealthSummary
- Like / ExpertLike
- CommissionChallenge / ChallengeSubmission
- RouteAdoption

## Non-negotiable separations
- Route identity != RouteVersion.
- RouteVersion != RouteSession.
- Route definition != participant progress/responses.
- Place != RouteStation.
- Public route payload != protected answer keys/private evidence/student data.
- Approval/verification belongs to a specific version where relevant.

## Backend sequence
1. Read-only pre-backend audit.
2. Focused cleanup of blockers.
3. Firebase dev/staging project.
4. Auth + minimal user profile.
5. Organization membership/capabilities.
6. Core Firestore schema: Route/Version/Team/Review.
7. Security Rules + Emulator tests.
8. Creator draft persistence.
9. Submit/review/revision.
10. Participant Session/Progress/Responses.
11. Storage + evidence rules.
12. QR/passcode.
13. contextual GPS.
14. trusted Functions only where needed.
15. analytics for pilot questions.

## Vertical Slice #1
Student auth → team → route draft → 2 stations → save → submit creates RouteVersion → teacher requests change → student resubmits → teacher approves class/school → participant joins RouteSession → completes stations → progress persists → emulator tests prove security boundaries.

## Security boundaries
Never client-only:
- role/capability changes
- organization membership
- teacher approval
- publication level
- expert status / Expert Likes
- protected scoring
- answer validation
- private student/evidence access
- storage paths/visibility
- exact/live location exposure
