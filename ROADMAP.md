# Job Hunt Command Center — Build Roadmap

> Status tracker for the full build. Check off tasks as you go. Every task maps to a section in `MASTER.md`.

---

## Start Here — First 5 Tasks

These unblock everything else. Do these before anything else.

- [ ] **[P1-1]** Implement `generateId(prefix)` utility and `USER_BACKGROUND_CONTEXT` constant
  — *Why first: every entity creation and every AI prompt depends on these two.*
- [ ] **[P1-2]** Implement `storageGet`, `storageSet`, `storageDelete` wrappers with try-catch
  — *Why first: nothing persists without this layer. All other code depends on it.*
- [ ] **[P1-3]** Implement app initialization sequence (read index → batch read jobs → read settings → setStorageReady)
  — *Why first: data must be in state before any view can render meaningfully.*
- [ ] **[P1-4]** Implement `addJob`, `updateJob`, `deleteJob` with optimistic updates + rollback
  — *Why first: the Kanban, Table, and Modal are all useless without working CRUD.*
- [ ] **[P1-5]** Implement `Toast` atom + `ToastContainer` + `showToast(type, message)` function
  — *Why first: error feedback from all other features routes through this. Build it once early.*

---

## Decisions Locked — Do Not Revisit

These architectural choices are final. Do not re-open them during the build.

- **Storage strategy:** `jobs:index` array pattern (not `window.storage.list()`). Optimistic state updates, async persist, rollback on failure. All calls in try-catch.
- **Single file constraint:** The entire app is one `.jsx` artifact. Hard limit: under 3000 lines. No file splitting under any circumstances.
- **Component count:** 35 defined components (see MASTER.md §8). Check the inventory before creating a new one.
- **Aesthetic:** Dark Ops Dashboard. Colors locked (`#080C14` base, `#00C8FF` cyan, `#10B981` emerald). Fonts locked (Space Grotesk / DM Sans / JetBrains Mono).
- **AI call pattern:** `callClaude(prompt, featureKey, maxTokens)` wrapper. JSON-only responses. Results cached on the job object. Optimistic state on save.
- **Model:** `claude-sonnet-4-20250514` — do not change.
- **No `<form>` tags, no `localStorage`, no `window.confirm()`, no external DnD library.**

---

## Full Build Checklist

### Phase 1 — Foundation: Storage Layer + Data Model + CRUD
*Overall complexity: Medium*

- [x] **[P1-1]** Implement `generateId(prefix)` utility and `USER_BACKGROUND_CONTEXT` constant — *Low*
- [x] **[P1-2]** Define default values for all entities (Job, Contact, AIAnalysis, InterviewPrep, UserSettings) — *Low*
- [x] **[P1-3]** Implement `storageGet`, `storageSet`, `storageDelete` wrappers with try-catch — *Low*
- [x] **[P1-4]** Implement app initialization sequence: read index → batch read jobs → read settings → setStorageReady — *Medium*
- [x] **[P1-5]** Implement `addJob(jobData)` with optimistic update + async persist + rollback — *Medium*
- [x] **[P1-6]** Implement `updateJob(id, changes)` with optimistic update + async persist + rollback — *Medium*
- [x] **[P1-7]** Implement `deleteJob(id)` — remove from state, delete key, update index, rollback — *Medium*
- [x] **[P1-8]** Implement `saveSettings(changes)` with optimistic update + async persist — *Low*
- [x] **[P1-9]** Implement `Toast` atom + `ToastContainer` + `showToast(type, message)` — *Low*
- [x] **[P1-10]** Implement `ConfirmButton` atom (two-step: click to arm, click to fire) — *Low*
- [ ] **[P1-11]** Verify: add job → refresh → confirm persists. Delete → confirm gone. Failure → rollback + toast. — *Low*

---

### Phase 2 — Core Views: Navigation + Kanban + Table
*Overall complexity: High*

- [x] **[P2-1]** Implement `Sidebar` with `NavItem`, view switching, collapse/expand toggle — *Medium*
- [x] **[P2-2]** Implement `StatusBadge` and `SourceBadge` atoms with correct colors per MASTER.md §8 — *Low*
- [x] **[P2-3]** Implement `TagPill` atom (display + optional remove button) — *Low*
- [x] **[P2-4]** Implement `TagInput` atom (type + Enter to add pill) — *Low*
- [x] **[P2-5]** Implement `JobCard` for Kanban (company, role, source badge, days indicator, AI dot) — *Low*
- [x] **[P2-6]** Implement `KanbanColumn` (header with count badge + accent border, card list, empty ghost card) — *Medium*
- [x] **[P2-7]** Implement `KanbanView` horizontal scroll container with all 7 columns — *Low*
- [x] **[P2-8]** Implement drag-and-drop via pointer events (pointerDown/Move/Up), ghost card, drop zone highlight — *High*
- [x] **[P2-9]** Implement `ContactRow` atom with all contact fields — *Low*
- [x] **[P2-10]** Implement `JobForm` with all fields, TagInput, ContactRow list — *Medium*
- [x] **[P2-11]** Implement `JobModal` with view/edit/add modes, unsaved-changes guard (no window.confirm) — *High*
- [x] **[P2-12]** Wire modal open from JobCard click + "Add" button, correct modalMode per context — *Low*
- [x] **[P2-13]** Implement `TableFilters` (search with 150ms debounce + status/source multi-select + date range) — *Medium*
- [x] **[P2-14]** Implement `TableView` with useMemo filtering+sorting, sortable headers, `TableRow` — *Medium*
- [x] **[P2-15]** Implement `EmptyState` component — *Low*
- [ ] **[P2-16]** Verify: full CRUD through Kanban and Table. Drag between columns persists. Filters work. — *Low*

---

### Phase 3 — Dashboard with Charts
*Overall complexity: Medium*

- [x] **[P3-1]** Implement `GoalRing` SVG component (props: value, max, size, color — pure SVG, no Recharts) — *Medium*
- [x] **[P3-2]** Implement `MetricCard` atom (number + label + optional sub-element) — *Low*
- [x] **[P3-3]** Implement all 4 computed dashboard metrics (totalApps, thisWeekApps, responseRate, activePipeline) — *Low*
- [x] **[P3-4]** Implement weekly history computation: last 8 ISO weeks, count apps by dateApplied per week — *Medium*
- [x] **[P3-5]** Implement `StatusDonutChart` with Recharts PieChart, custom tooltip, legend — *Medium*
- [x] **[P3-6]** Implement `WeeklyBarChart` with Recharts BarChart, ReferenceLine at weeklyGoal — *Medium*
- [x] **[P3-7]** Implement `RecentActivityList` (last 5 by lastActivity, relative time formatting) — *Low*
- [x] **[P3-8]** Implement `FollowUpList` (stale applied/screening jobs, "Mark as Followed Up" action) — *Low*
- [x] **[P3-9]** Wire donut segment click → navigate to Table view with status filter pre-applied — *Low*
- [x] **[P3-10]** Compose full `DashboardView` layout — *Low*
- [x] **[P3-11]** Wire `EmptyState` to Dashboard, Kanban, Table — *Low*
- [ ] **[P3-12]** Verify: add apps from different weeks, charts and all 4 metrics update correctly — *Low*

---

### Phase 4 — AI Features
*Overall complexity: Medium*

- [x] **[P4-1]** Implement `callClaude(promptText, featureKey, maxTokens)` wrapper (see MASTER.md §11) — *Medium*
- [x] **[P4-2]** Implement `FitScoreRing` SVG ring (color-coded: green 70–100, amber 40–69, red 0–39) — *Low*
- [x] **[P4-3]** Implement `SkillPillRow` (horizontally scrollable colored pill tags, accepts color prop) — *Low*
- [x] **[P4-4]** Implement `JDAnalyzerPanel` (textarea, button, FitScoreRing, 3× SkillPillRow, Save action) — *Medium*
- [x] **[P4-5]** Implement `CoverLetterPanel` (inputs, button, editable textarea output, Copy + Save) — *Medium*
- [x] **[P4-6]** Implement `AccordionItem` atom (toggle expand/collapse) — *Low*
- [x] **[P4-7]** Implement `InterviewPrepPanel` (textarea + role type dropdown, button, AccordionItem list) — *Medium*
- [x] **[P4-8]** Implement `AIResultsPanel` inside JobModal (3-tab panel: Analysis / Cover Letter / Interview Prep) — *Medium*
- [x] **[P4-9]** Wire "Analyze from modal" to pre-fill jdText + save AIAnalysis to job + persist — *Low*
- [x] **[P4-10]** Wire "Generate cover letter from modal" + save coverLetter to job + persist — *Low*
- [x] **[P4-11]** Wire "Generate interview prep from modal" + save interviewPrep to job + persist — *Low*
- [x] **[P4-12]** Implement Weekly Report modal (compute from state, plain text output, Copy button) — *Low*
- [x] **[P4-13]** Implement JSON Export (Blob download, filename job-hunt-export-YYYY-MM-DD.json) — *Low*
- [ ] **[P4-14]** Verify: analyze JD → save → close modal → reopen → cached result with date. All 3 AI tools parse correctly. — *Low*

---

### Phase 5 — Polish, Animations, Error Handling
*Overall complexity: Low–Medium*

- [x] **[P5-1]** Add modal slide-up entry/exit CSS transitions (transform + opacity keyframes) — *Low*
- [x] **[P5-2]** Add AI output shimmer loading placeholder (pulsing gray lines, CSS keyframe) — *Low*
- [x] **[P5-3]** Add Kanban drag ghost card visual (pointer-position clone, semi-transparent) — *Medium*
- [x] **[P5-4]** Add toast enter/exit animations (slide-in from right, slide-out right) — *Low*
- [x] **[P5-5]** Add Kanban column drop-zone cyan dashed border during active drag — *Low*
- [x] **[P5-6]** Add focus ring styles on all interactive elements (outline: 2px solid #00C8FF) — *Low*
- [x] **[P5-7]** Add storageReady === false full-screen loading state (spinner + "Loading your command center…") — *Low*
- [x] **[P5-8]** Implement `SettingsPanel` overlay (name, weeklyGoal, targetRoles, Export button) — *Low*
- [x] **[P5-9]** Audit all aiLoading states — every AI call disables inputs and restores correctly — *Low*
- [x] **[P5-10]** Audit all error paths — every storage write failure shows toast and rolls back state — *Low*
- [x] **[P5-11]** Verify line count < 3000 — extract repeated JSX into components if needed — *Low*
- [ ] **[P5-12]** Final walkthrough: all 3 tiers, all 5 empty states, all error states, all loading states — *Low*

---

## AI Prompt Cheatsheet

Quick reference for the three AI features. Full prompt strings are in `MASTER.md §12`.

| Feature | Section in MASTER.md | max_tokens | Output keys to parse |
|---|---|---|---|
| JD Analyzer | §12 Prompt 1 | `800` | `fit_score`, `matched_skills`, `gaps`, `keywords` |
| Cover Letter Generator | §12 Prompt 2 | `1200` | `cover_letter`, `key_points` |
| Interview Prep | §12 Prompt 3 | `1500` | `technical_questions`, `behavioral_questions` |

All three: parse with `JSON.parse(responseText.trim())`. Catch `SyntaxError` separately from HTTP errors. Store `generatedAt: new Date().toISOString()` alongside results.

---

## Reference

| Resource | Path | What's in it |
|---|---|---|
| Full specification | `MASTER.md` | Data model, storage schema, all feature specs, UI/UX palette, component tree, state shape, prompt strings, build plan |
| Project instructions | `.claude/CLAUDE.md` | Rules for Claude when working on this project |
| Prompt engineering | `/prompt-master` skill | Use to write or refine AI prompts used inside the app |
| UI/UX decisions | `/ui-ux-pro-max` skill | Use for component design, layout, color system questions |
