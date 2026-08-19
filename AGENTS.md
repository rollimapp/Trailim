# AGENTS.md — Trailim Agent Rules V1

## Source of truth
`C:\TrailimGit` is the only authoritative Trailim code workspace.

## Workflow
Analysis → Approval → Implementation → Validation → Commit.

## Safety rules
- One closed task at a time.
- No parallel edits to the same files.
- Read-only audit first for sensitive work.
- Do not change product scope or UX without an approved spec.
- Do not run global formatters or whitespace cleanup.
- Preserve encoding and line endings.
- Use the smallest possible diff.
- If the diff is unexpectedly large or formatting-heavy: STOP and report.
- Never print, stage, or commit secrets.
- No Firebase production deploy/write during audit.
- No commit, push, merge, or deploy without explicit instruction.
- Do not use `git add .` for future change tasks; stage only approved files.
- Do not remove a mock fallback until the production replacement is working and tested.

## Windows / PowerShell
Use:
- `npm.cmd`
- `npx.cmd`
- `firebase.cmd`

## Required validation after implementation
As relevant:
- `git diff --check`
- TypeScript check (`npx.cmd tsc --noEmit`) or project lint script
- `npm.cmd run build`
- focused unit/integration tests
- Firestore/Storage Emulator tests for Rules changes
- report exactly what was and was not tested

## Reporting
Every completion report must:
- list exact files changed
- summarize exact behavior changed
- show/describe diff scope
- distinguish: REAL/PRODUCTION, FUNCTIONAL LOCAL, MOCK/SIMULATED, MODELED, MISSING
- identify remaining risks
- confirm no unrelated files were modified

## Tool roles
- ChatGPT: Product Owner / architecture / PM / QA gate / competitor research
- AI Studio: UX and visual prototype exploration, not production source-of-truth after local handoff
- Antigravity: candidate local audit/implementation agent; start read-only
- Claude Code: deep code/Firebase/security/rules/tests when needed
- Codex/VS Code agent: alternative reviewer/implementer; never concurrently edit the same files as another agent
- Git/GitHub: objective history and rollback
