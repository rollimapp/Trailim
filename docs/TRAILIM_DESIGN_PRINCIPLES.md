# Trailim — Product & Visual Design Principles

_Last updated: 2026-09-20_

## Product principle

**Field-first on mobile. Workspace-first on desktop.**

- Mobile is the experience layer: explore, navigate, field tasks, QR/camera/location, short responses, route participation.
- Desktop is the creation and management layer: project setup, research, stations, teacher review, progress, teams, publishing.
- Same product, same backend, same brand. Different interaction depth by context.

## Core usability rule

A user should understand what to do within roughly 10 seconds.

- Teacher home answers: **What needs my attention now?**
- Student home answers: **What do I need to do now?**
- Field mode answers: **Where am I and what do I do here?**

Complexity may exist in the system, but should be progressively disclosed.

### Screen rules

- One primary job per screen.
- One clearly dominant action whenever possible.
- Avoid exposing future stages unless useful now.
- Avoid data that does not lead to an action.
- Review one submission at a time.
- Student sees the current stage first, not the whole system.
- Desktop rich does **not** mean desktop complex.

## Desktop navigation direction

Teacher desktop:
- Home
- My Projects
- Review
- Students
- Create Project
- Explore
- Community

Teacher lands on **Teacher Home**, not Explore.

Student desktop should prioritize:
- What I need to do now
- Current project/stage
- My route/stations

Mobile keeps the existing Trailim exploration experience and should remain visually rich and field-oriented. Teacher/student work areas are accessible without replacing the existing mobile app identity.

## Visual identity

Trailim should feel like a product about **place, movement, discovery and field learning** — not a generic education dashboard.

### Primary visual motifs

Use a small, consistent set:
1. **Route line**
2. **Waypoint / GPS marker**
3. **Field note / stamped label**
4. **Subtle topographic / map texture**

These motifs should create continuity across screens.

### Use visual motifs for meaning

Prefer motifs that explain state or progress:
- project stages as checkpoints
- progress as a route with waypoints
- field verification as location/waypoint state
- approved station as completed checkpoint
- review flow as a clear stop before moving forward

### Do not overdecorate

Avoid:
- footprints everywhere
- cartoon treasure-map styling
- excessive doodles
- decorative stickers on every card
- visual motifs that do not carry meaning
- multiple competing motif families on one screen

The goal is **field exploration**, not childish adventure-game UI.

## Anti-generic rules

Avoid:
- SaaS dashboard look
- card soup
- every area inside a rounded box
- excessive pills/badges
- repeated icon + title + subtitle cards
- decorative gradients without purpose
- oversized empty whitespace
- overuse of Lucide-style icons as visual identity
- symmetrical KPI-dashboard compositions unless genuinely useful

Rule:
**Objects can be cards. Workspace structure should not be cards.**

Use continuous surfaces, strong hierarchy, editorial composition, photography, map language and selective visual motifs.

## Teacher visual tone

Teacher desktop should feel:
- clear
- calm
- capable
- visually appealing
- professional
- easy to scan

It may contain rich imagery, but the UI should not become playful or decorative enough to reduce confidence or speed.

## Student visual tone

Student screens can be more expressive:
- stronger sense of route/progress
- richer visuals
- waypoint/checkpoint language
- imagery tied to place
- more field-action cues

Still avoid gimmicks or game-like decoration that competes with the learning task.

## Imagery as a product requirement

Visual quality is part of the product, not optional decoration.

Projects and stations should strongly encourage a representative image.

Student creation flow should support:
- upload a field photo
- take a photo on site
- optionally generate an AI image

AI image generation belongs **inside project/station creation**, not on teacher home.

Suggested generation guidance:
- realistic, high-quality image of the place/topic
- natural light
- no embedded text
- suitable for a route/project card
- consistent crop/aspect ratio

Product should provide:
- fixed aspect ratios
- automatic crop
- graceful fallback when no image exists
- quality guidance

## Hebrew and RTL

Hebrew MVP must feel native, not translated.

Use natural Hebrew such as:
- בדיקות
- עבודות שמחכות לבדיקה
- פתח לבדיקה
- החזרה לתיקון
- אישור העבודה
- הפרויקטים שלי
- יצירת פרויקט
- גילוי מסלולים
- הגשות אחרונות

Avoid English product jargon in the Hebrew experience unless there is a clear reason.

## Teacher Home

Teacher Home is not a system dashboard. It is an orientation screen.

Primary content:
- active project
- items waiting for review
- active groups/projects
- visually rich project cards
- quick path back to Explore

The home can be visually rich, but not every feature needs equal visual weight.

## Review

Review should answer one question:
**What is waiting for me, and what decision do I need to make?**

Primary flow:
Open submission → inspect → feedback → approve or return for revision.

Avoid moderation/admin terminology in teacher-facing copy.

## Current implementation direction

The current desktop work uses:
- TeacherHomeVisualProof as the visual direction for teacher home
- DesktopTeacherReview as the visual direction for review
- GuidedProjectWorkspace as a deeper project overview/workspace, not the teacher landing page

These are visual/UX directions first. Backend/data wiring should preserve the existing Trailim route/version/review model and should not hard-code one Ministry assessment workflow into core domain objects.

## Development workflow

Default workflow:
- Product/UI iteration: edit directly in GitHub, commit to feature branch, user pulls and reviews.
- Use heavier autonomous tooling only when it has a clear advantage: large refactors, backend/infrastructure, Firebase, complex local test/debug loops, or wide multi-file changes.

Do not keep using indirect prompt handoffs when direct repository work is sufficient.


## Workflow-as-route principle

Trailim should not try to escape generic boxy UI by scattering decorative route lines across dashboards.

Instead, use the route metaphor where it has **structural meaning**:

- student project stages
- station creation flows
- field verification
- teacher review/progress
- guided assignments

The route metaphor should communicate:
**completed → current → next → locked/future**

Use checkpoints, a connecting path, and progressive disclosure so users always understand:
- where they are
- what is complete
- what to do now
- what comes next

For teachers, show the same journey as progress and review status.
For students, show it as a guided sequence of tasks.

Avoid turning dashboard decoration into a stepper unless the steps are truly the workflow.


## Student stage visibility and unlock rule

For guided student projects:

- Only the **completed stage(s)** and the **current active stage** should be prominent.
- Future locked stages should **not** all appear as full cards. This creates unnecessary cognitive load.
- Future stages should be summarized in one compact **"What comes next?"** disclosure.
- The disclosure may reveal a minimal list of upcoming stage names/requirements, but future stage content remains locked.
- A future stage must not become interactive until the current stage's required conditions are satisfied and, where configured, teacher approval is complete.
- This is both a UX rule and a workflow rule. UI gating alone is not sufficient for production; persistence/workflow logic must enforce it when the real Project model is wired.

Visual direction:
- completed = compact
- current = expanded and actionable
- future = collapsed / secondary
- reduce rounded card nesting; prefer editorial dividers, continuous surfaces, and one active work surface.
