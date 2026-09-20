# Trailim Guided Project MVP

## Product boundary

The first pilot is a guided, place-based school project. It is **not** a hard-coded "alternative assessment" product.

Trailim Core remains general:

Project → Creator/Team → Guided Stages → Stations/Activities → Field Experience → Review/Revision → Report → Publish → Experience

The Ministry of Education social-sciences tour is the first template, not the domain model.

## MVP user story

A teacher defines a place-based project and its requirements. Students work alone or in teams, follow a guided sequence, complete each required task once, build stations/activities, conduct the field experience, receive feedback, revise, and finish with a generated report assembled from the work they already authored.

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

The current visual slice does not yet implement all production wiring. The MVP must next add:
- real Project / ProjectTemplate persistence;
- real team membership / roster provisioning;
- stage submissions and teacher approval gates;
- field uploads / evidence;
- report generation from authored project data;
- optional grading / rubric mapping;
- optional Google Classroom import/export/integration.

These should be added without changing the general template-driven architecture.


## Canonical student flow for the first pilot

The official AI-assisted educational-tour task is normalized into a **single-pass workflow**. Students should never be asked to author the same material twice.

1. **Topic selection**
   - choose a unique topic / concept / theory;
   - connect it to a place or phenomenon;
   - add a short rationale for why the topic fits the chosen place;
   - submit for teacher approval;
   - approval unlocks the next stage.

2. **Preliminary research**
   - at least 2 reliable sources;
   - citation / source details for each source;
   - a short student-authored summary of what was learned from each source;
   - 5 relevant concepts/theories;
   - each concept/theory explained in the students' own words;
   - an optional teacher-defined length/quality requirement (for example: 2–4 sentences per concept, half a page total, etc.);
   - teacher review/approval;
   - everything written here becomes report material later; students do not rewrite it.

3. **Plan the activity and Trailim stations**
   - define the group activity that will be delivered during the tour;
   - build the required number of stations (2–3 for the current pilot, configurable in templates);
   - every station contains: title; location/place; what visitors should notice/understand; explicit link to one or more researched concepts/theories; student-authored explanation; visitor action/task/question; optional media/evidence;
   - submit the activity/stations for teacher approval before the tour.

4. **Tour in the field: verify + run + document**
   - one field outing is sufficient for the pilot;
   - at each station, quickly verify that the location/instructions still work;
   - make corrections if necessary;
   - run the planned activity;
   - record observations/findings and optional evidence;
   - this is not a mandatory separate pre-tour field check;
   - personal experiential content must remain student-authored.

5. **Analysis, reflection and report**
   - demonstrate the same 5 concepts/theories through what was observed during the tour;
   - explain the relationship/difference between theoretical definitions and their expression in the field;
   - each student completes an individual reflection inside Trailim;
   - reflection remains individually attributed even when the rest of the project is group-owned;
   - Trailim assembles a Report Draft from material already written across stages: topic/rationale, research and sources, concept explanations, activity/station planning, field observations, analysis, individual reflections, bibliography;
   - students review/edit the generated draft before final submission.

6. **Presentation + publish**
   - present the group product/activity and major findings;
   - connect findings to theory and answer participant questions;
   - after final teacher approval, publish or assemble approved stations into the class Trailim route;
   - final report export is produced from the approved project data.

### No-duplicate-work principle

A Trailim project is the system of record. The final written report is a **derived artifact**, not a second assignment.

Each field/task in a stage may declare a report mapping, for example:
- topic rationale → Introduction;
- source summaries + concept explanations → Theoretical background;
- station/activity plan → Method / Planning;
- field observations → Findings;
- theory-to-field analysis → Analysis;
- reflection → Individual reflection;
- source metadata → Bibliography.

The report generator may order sections, combine already-authored text, remove obvious repetition, add neutral transitions, format citations/bibliography, and flag missing content. It must not invent factual findings, personal reflection, or conceptual analysis that students did not author.

### Stage completion / unlock model

Each stage is configurable with:
- required fields;
- minimum/maximum counts;
- minimum length / word count / character count where relevant;
- whether teacher approval is required;
- whether all team members must contribute;
- whether an individual response is required;
- whether media is required/optional;
- whether field location/evidence is required;
- report mappings.

A stage unlocks only when its configured completion conditions are satisfied.

### Team model

The project belongs to a **team**, not to the one student who happens to submit.

For the MVP:
- a teacher creates/imports a class roster or shares a join link/code;
- students form or are assigned to teams;
- every team has 1–3 members for the current template;
- all members see and edit the same group project;
- the system records who added/edited each item for accountability;
- teacher approval is applied to the team submission/version;
- individual reflection is stored separately per student;
- final report includes all team member names automatically.

A student should never need to type the names of teammates into a final submission form if Trailim already knows the team membership.

### Teacher approval model

Teachers need a simple checkpoint workflow:
**student/team submits stage → teacher opens exact submitted version → approve OR return with feedback → team revises → resubmit.**

Approval can be configured per stage. The current Ministry template should use checkpoints at least after topic selection, preliminary research/activity plan, station/activity planning, and final project/report.

Teacher comments belong to the relevant stage/version, not to a separate messaging system.

### Project templates: current pilot vs future use cases

The Ministry social-sciences tour is only the first ProjectTemplate.

A template defines:
- stage order;
- stage labels/instructions;
- required fields;
- source/concept/station counts;
- text-length requirements;
- media requirements;
- teacher checkpoints;
- deadlines;
- rubric/scoring;
- report mappings;
- whether individual reflection exists;
- whether publishing a Trailim route is required.

Example: a Grade 8 neighborhood-street project might use only:
1. choose street/place;
2. research the name/story;
3. create one or two stations;
4. visit and document;
5. present/publish.

It can require zero formal sources, no five-concept theory section, no written report, and different media/tasks.

The UI should therefore render a project from template configuration rather than hard-code the Ministry flow.
### Media policy for the pilot

Photos, audio, video, QR and similar media are **Trailim capabilities/enhancements**, not baseline Ministry requirements for this task.

For the pilot:
- media should be optional by default;
- every station should require meaningful place-based content and an activity, not media for media's sake;
- Trailim may encourage one useful media/evidence element per station (field photo, short audio, short video, observation evidence, etc.);
- teacher/project templates may later make specific media types required.

### Important note on the official booklet

The AI-assisted booklet describes the tour/activity twice in its numbered stages (tour execution and later activity execution/scoring). Trailim normalizes this into one chronological flow: **choose topic → research → plan activity/stations → one field tour (verify + run + document) → analyze/reflect/report → present/publish** while preserving the official assessment requirements.
