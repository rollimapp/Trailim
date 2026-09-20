# Trailim Guided Project MVP

## Product boundary

The first pilot is a guided, place-based school project. It is **not** a hard-coded "alternative assessment" product.

Trailim Core remains general:

Project → Creator/Team → Research → Stations → Field Check → Review/Revision → Route Assembly → Publish → Experience

The Ministry of Education social-sciences tour is the first template, not the domain model.

## MVP user story

A teacher defines a place-based project and its requirements. Students work alone or in teams, follow a guided sequence, research a topic, build stations, verify them in the field, submit for feedback, revise, and contribute approved stations to a shared route.

## Architecture guardrails

- Do not introduce an `AlternativeAssessment` entity.
- Project requirements must be template/configuration driven.
- Preserve the existing Route → Station → Task → Version → Review → Session → Participation domain.
- Keep the report as a derived project artifact, not the system of record.
- Do not hard-code the current rubric, number of sources, concepts, or stations into core entities.
- Desktop is the primary creation/review workspace. Mobile remains the field experience surface.
- Existing mobile behavior must remain unchanged while the desktop project workflow is introduced.

## First template: social sciences educational tour

Current known requirements from the official booklet:
- teams up to 3 students;
- a unique topic per group;
- at least 2 reliable sources in the AI-assisted version;
- 5 relevant concepts/theories;
- a physical or virtual tour;
- a group activity delivered during the tour;
- theory-to-field analysis;
- teacher review/checkpoints;
- an individual reflection;
- a written report and class presentation.

Items that remain configurable in Trailim:
- minimum/maximum team size;
- source count;
- concept count;
- station count;
- whether field check is required;
- whether media is required;
- teacher checkpoints;
- deadlines;
- report section mapping;
- rubric/scoring.

## Desktop design direction

The desktop workspace should feel like a professional authoring tool, not a stretched phone:
- shallow navigation;
- continuous surfaces;
- subtle separators;
- no KPI-card dashboard;
- no nested card soup;
- one primary job per screen;
- project outline / workspace / inspector pattern.

## First vertical slice

Teacher:
1. Opens a Project workspace.
2. Sees stages and team status.
3. Opens a team.
4. Reviews current work.
5. Sends feedback or approves a checkpoint.

Student:
1. Opens the same Project.
2. Sees exactly what must be done now.
3. Adds sources/concepts/content.
4. Understands what is missing before submission.
5. Sends the stage for teacher approval.

This first slice intentionally does not implement:
- final report generation;
- map route optimization;
- real project persistence;
- real roster/team provisioning;
- field uploads;
- grading.

Those follow after the desktop workflow is validated.
