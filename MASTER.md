# Job Hunt Command Center — Master Reference Document

> Single source of truth for the entire product. A developer must be able to build the complete app from this document alone with zero ambiguity. Do not summarize or abbreviate when implementing — use exact field names, exact hex values, exact prompt strings.

---

## 1. App Overview

### Description

Job Hunt Command Center is a single-page, AI-augmented personal dashboard built for a fresh AWS/DevOps graduate in the Philippines who is running a high-volume job search across multiple platforms simultaneously. It replaces the fractured system of spreadsheets, sticky notes, and browser tabs with one persistent, opinionated command center that tracks every application, visualizes pipeline health, and puts three Claude-powered AI tools — a JD fit analyzer, cover letter generator, and interview prep coach — directly inside the same workflow where applications are managed.

### Core Value Proposition

A spreadsheet can store data. This app provides intelligence on top of that data: it shows you where your pipeline is stalling, tells you whether a job description is actually a fit before you apply, writes your cover letter in context of your specific background, and generates interview questions tailored to the exact role. The difference is zero context-switching — AI output lives alongside the application record it was generated for.

### User Stories

- "As a job hunter, I want to see all my applications organized by status in a Kanban board so that I can immediately see where my pipeline is bottlenecked."
- "As a job hunter, I want to paste a job description and get a fit score with skill gap analysis so that I can prioritize which jobs to spend time applying to."
- "As a job hunter, I want to generate a tailored cover letter from within an application record so that I never have to open a separate document or tab."

---

## 2. Technical Constraints

### Storage API (ONLY persistence mechanism — no exceptions)

```js
window.storage.get(key, defaultValue)   // async, returns stored value or default
window.storage.set(key, value)          // async, persists value
window.storage.delete(key)              // async, removes key
window.storage.list(prefix)            // async, returns array of matching keys
```

- All calls are **async** — always `await`
- All calls **can fail** — always wrap in `try { } catch (e) { }`
- Use hierarchical keys: `"jobs:job_123"`, `"settings:profile"`, `"stats:weekly"`
- Batch related data into single keys to minimize calls
- **NEVER use `localStorage` or `sessionStorage`** — not supported

### Available Imports (ONLY these — no others)

```js
import { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react'
import { /* any icons */ } from 'lucide-react'
import { PieChart, BarChart, /* etc */ } from 'recharts'
import _ from 'lodash'
import { /* components */ } from '@/components/ui' // shadcn/ui
```

### Claude-in-Claude API

```js
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: "prompt here" }]
  })
});
const data = await response.json();
const text = data.content[0].text;
```

- No API key needed
- Model: `claude-sonnet-4-20250514`
- Always instruct Claude to return **raw JSON only** — no markdown fences, no preamble

### Other Constraints

- **NO `<form>` tags** — use `onClick`/`onChange` handlers only
- **Single .jsx file** — entire app in one artifact, under 3000 lines
- No TypeScript — plain JSX with JSDoc comments for types if needed

---

## 3. Data Model

### Entity: Job

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | yes | Format: `job_${Date.now()}_${Math.random().toString(36).slice(2,8)}` |
| `company` | `string` | yes | Company name |
| `role` | `string` | yes | Job title as listed |
| `url` | `string` | no | Job posting URL |
| `source` | `string` (enum) | yes | `'JobStreet' \| 'LinkedIn' \| 'AWS Partner Network' \| 'Company Website' \| 'Referral' \| 'Other'` |
| `status` | `string` (enum) | yes | `'saved' \| 'applied' \| 'screening' \| 'interview' \| 'offer' \| 'rejected' \| 'ghosted'` |
| `dateSaved` | `string` | yes | ISO 8601 date string, set on creation |
| `dateApplied` | `string \| null` | no | ISO 8601 date string, set when status → applied |
| `lastActivity` | `string` | yes | ISO 8601 datetime, updated on any edit |
| `salary` | `SalaryRange` | no | See SalaryRange entity |
| `notes` | `string` | no | Free-form text |
| `contacts` | `Contact[]` | no | Default `[]` |
| `tags` | `string[]` | no | User-defined labels, default `[]` |
| `jdText` | `string` | no | Raw job description paste, used by AI tools |
| `aiAnalysis` | `AIAnalysis \| null` | no | Cached JD analyzer result |
| `coverLetter` | `string \| null` | no | Cached generated cover letter text |
| `interviewPrep` | `InterviewPrep \| null` | no | Cached interview prep result |

### Entity: SalaryRange

| Field | Type | Notes |
|---|---|---|
| `min` | `number \| null` | Numeric value |
| `max` | `number \| null` | Numeric value |
| `currency` | `'PHP' \| 'USD'` | Default `'PHP'` |

### Entity: Contact

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | Format: `contact_${Date.now()}_${Math.random().toString(36).slice(2,6)}` |
| `name` | `string` | Contact's full name |
| `role` | `string` | Their job title |
| `email` | `string` | Optional |
| `linkedin` | `string` | Profile URL |
| `notes` | `string` | Free-form context |

### Entity: AIAnalysis

| Field | Type | Notes |
|---|---|---|
| `fit_score` | `number` | Integer 0–100 |
| `matched_skills` | `string[]` | Skills in both JD and user background |
| `gaps` | `string[]` | Skills in JD missing from user background |
| `keywords` | `string[]` | Suggested resume optimization keywords (8–12) |
| `generatedAt` | `string` | ISO datetime of generation |

### Entity: InterviewPrep

| Field | Type | Notes |
|---|---|---|
| `technical_questions` | `PrepQuestion[]` | Array of Q+A pairs |
| `behavioral_questions` | `PrepQuestion[]` | Array of Q+A pairs |
| `generatedAt` | `string` | ISO datetime of generation |

### Entity: PrepQuestion

| Field | Type | Notes |
|---|---|---|
| `question` | `string` | The question text |
| `suggested_answer` | `string` | 2–4 sentence answer outline |

### Entity: UserSettings

| Field | Type | Default | Notes |
|---|---|---|---|
| `name` | `string` | `''` | User's display name |
| `weeklyGoal` | `number` | `15` | Target applications per week |
| `targetRoles` | `string[]` | `['Cloud Engineer', 'DevOps Engineer', 'SRE']` | Injected into AI prompts |
| `targetLocations` | `string[]` | `['Philippines', 'Remote']` | Injected into AI prompts |

---

## 4. Storage Key Schema

| Key Pattern | Value Type | Description | Read Trigger | Write Trigger |
|---|---|---|---|---|
| `jobs:index` | `string[]` | Array of all job IDs | App init | On add job / delete job |
| `jobs:{id}` | `Job` object | Full job object | App init (batched) | On any job field edit, on AI result save |
| `settings:profile` | `UserSettings` object | User preferences | App init | On settings save |

### Rationale for `jobs:index` Pattern

Rather than calling `window.storage.list('jobs:')` on every init (which requires an extra async call), we maintain a single index array. On load: read `jobs:index` once → get all IDs → batch-read all job objects in parallel with `Promise.allSettled`. Delete operations remove the ID from the index AND delete the individual key.

### Initialization Sequence

```
1. await window.storage.get('jobs:index', [])         → get ID list
2. Promise.allSettled(ids.map(id =>
     window.storage.get(`jobs:${id}`, null)))          → parallel read all jobs
3. filter out null results (orphaned entries)
4. clean up index: remove IDs that returned null
5. await window.storage.get('settings:profile', defaultSettings)
6. setState({ jobs: loadedJobs, settings })
7. setStorageReady(true)
```

### Add Job Write Strategy

```
1. Generate job object with new ID
2. Optimistically push to jobs[] in React state
3. await window.storage.set(`jobs:${job.id}`, job)
4. const ids = await window.storage.get('jobs:index', [])
5. await window.storage.set('jobs:index', [...ids, job.id])
6. On catch: remove job from state, showToast('error', 'Failed to save')
```

### Update Job Write Strategy

```
1. Find and replace job in state array optimistically
2. await window.storage.set(`jobs:${job.id}`, updatedJob)
3. On catch: restore previous job version in state, showToast('error', ...)
```

### Delete Job Write Strategy

```
1. Optimistically remove from state array
2. await window.storage.delete(`jobs:${id}`)
3. const ids = await window.storage.get('jobs:index', [])
4. await window.storage.set('jobs:index', ids.filter(i => i !== id))
5. On catch: re-insert job into state, showToast('error', ...)
```

---

## 5. Feature Specification — Tier 1 (Core)

### Feature 1.1: Application CRUD

**What the user sees:**
A floating action button labeled "+ Add Job" visible on Kanban and Table views. Opens a modal with a two-column form layout. Left column: Company (text input), Role (text input), Source (dropdown), Status (dropdown, default "saved"), Date Applied (date picker — visible and required only when status is "applied" or beyond), URL (text input with inline "open link" icon button). Right column: Salary Min (number), Salary Max (number), Currency (toggle PHP/USD), Tags (pill input, enter-to-add), JD Text (large textarea labeled "Job Description — paste here for AI tools"). Below both columns: Notes (full-width textarea). Contacts section at the bottom with "Add Contact" row expander. Footer: "Cancel" (ghost) and "Save Application" (primary CTA).

**Edit mode:** Opening any existing job card opens the same modal pre-filled. An "Edit" button in the modal header switches to editable mode. In view mode, all inputs are read-only. A red "Delete" button in the edit modal footer uses two-step confirmation (label changes to "Confirm Delete" on first click, executes on second).

**Validation:**
- Company and Role are required; show inline error text below the field (not alert)
- On save: if status is "applied" or beyond and `dateApplied` is null, auto-set to today

**Data written:** Full `Job` object to `jobs:{id}`. Updates `jobs:index` on add/delete.

**Edge cases:**
- Storage write fails: roll back optimistic state, toast "Failed to save — check your connection."
- URL field: do not validate format, just store the string
- Contacts with no name: skip saving that contact row silently
- Unsaved changes guard: if user clicks outside modal with dirty form, show inline warning bar with "Discard" and "Keep Editing" — no `window.confirm()`

---

### Feature 1.2: Kanban Pipeline View

**What the user sees:**
Seven columns in a horizontal scrollable container: Saved, Applied, Screening, Interview, Offer, Rejected, Ghosted. Each column header: column name + count badge + colored top border accent. Cards show: company name (bold), role title (muted), source badge (pill), days-since-applied indicator, colored dot if `aiAnalysis` present (color = fit score tier). Clicking any card opens the detail modal.

**Column accent colors (top border):**
- Saved: `#475569` | Applied: `#00C8FF` | Screening: `#F59E0B`
- Interview: `#8B5CF6` | Offer: `#10B981` | Rejected: `#EF4444` | Ghosted: `#334155`

**Drag and drop:** Pure pointer events (no external DnD library). `onPointerDown` stores dragged job ID + origin column. `onPointerMove` shows ghost card at pointer. `onPointerUp` over valid column triggers status update + persist. Drop target shows highlighted blue dashed border during hover. On drop: update `job.status`, `job.lastActivity`, persist to storage.

**Column behavior:**
- Column widths: fixed 220px, horizontal scroll on container
- Cards sorted within column by `lastActivity` descending
- Empty column: dashed border ghost card, "No applications here yet"
- More than 8 cards: column scrolls vertically
- "Add to this column" ghost button at column bottom opens Add modal with status pre-selected

**Data written:** `job.status`, `job.lastActivity` on drag-drop.

---

### Feature 1.3: Table View

**What the user sees:**
Full-width table with columns: Company, Role, Source, Status (colored badge), Date Applied, Salary, Days Active, JD? (checkmark if `jdText` populated), AI? (star if `aiAnalysis` present). Above table: search bar + Status multi-select dropdown + Source multi-select dropdown + Date Applied range + Sort control (column + asc/desc). Row count shown ("Showing 14 of 22"). Rows clickable to open detail modal.

**Behavior:**
- All filters apply in real time (no submit button), computed via `useMemo`
- Sorting: single-column, clicking same header toggles asc/desc
- "Days Active" calculated on render: for applied/screening/interview = `(today - dateApplied)` days; for saved = `(today - dateSaved)` days; for rejected/ghosted = `—`
- Zero filtered results: inline message "No applications match your filters." + "Clear filters" link

**Edge cases:**
- Very long names: CSS ellipsis at 200px max-width
- Missing `dateApplied` for non-saved job: show `—`

---

### Feature 1.4: Dashboard

**What the user sees:**

Four metric cards (full width, 4 columns): Total Applications, Applied This Week (with "/ [goal] goal" subtitle + GoalRing), Response Rate (%), Active Pipeline (count in screening+interview+offer).

Two side-by-side panels: Left = status donut chart (Recharts PieChart with legend showing status + count + %). Right = weekly activity bar chart (Recharts BarChart, last 8 ISO weeks, horizontal dashed line at `weeklyGoal`).

Below: Recent Activity list (5 most recently modified jobs, each showing company + role + status badge + human-readable time delta e.g. "2 hours ago").

**Metric formulas:**
- Response Rate = `(screening + interview + offer) / applied × 100` — show `—%` if denominator is 0
- This Week = Monday–Sunday of current ISO week
- GoalRing color: green if `≥ weeklyGoal`, amber if `50–99%`, red if `< 50%`

**Interactions:**
- Clicking a donut chart status segment: navigates to Table view with that status filter pre-applied
- Zero applications: show EmptyState with CTA "Add Your First Application"
- `weeklyGoal` = 0 or undefined: default to 15 for calculations, show settings nudge

**Data read:** All `jobs[]` from state + `settings.weeklyGoal`. No separate storage reads — all computed on render.

---

## 6. Feature Specification — Tier 2 (AI-Powered)

All AI features live in the "AI Tools" view AND can be triggered inline from within an open job modal when `jdText` is populated (shown as a bottom AI panel with tabs).

### Feature 2.1: JD Analyzer

**What the user sees:**
Card panel labeled "JD Fit Analyzer." Large textarea ("Paste job description here") + "Analyze Fit" button. If triggered from job modal, textarea pre-filled with `jdText`.

After submission — results view with four sections:
1. **Fit Score** — large circular SVG ring (not Recharts), score number in center (e.g., "78"), color-coded ring: green 70–100, amber 40–69, red 0–39
2. **Matched Skills** — scrollable row of green pill tags
3. **Skill Gaps** — scrollable row of red/amber pill tags
4. **Suggested Keywords** — scrollable row of blue pill tags + "Copy all" button

Footer buttons: "Regenerate" always visible. "Save to Application" visible only when triggered from job modal context.

**Loading state:** Button label → "Analyzing…" + spinner icon. Textarea disabled. Pulsing placeholder lines in output area.

**Cache behavior:** If `job.aiAnalysis` exists, show cached result immediately with "Last analyzed [date]" label. Show "Re-analyze" instead of "Analyze Fit".

**Data written:** `job.aiAnalysis`, `job.jdText` when "Save to Application" clicked.

**Edge cases:**
- API failure: toast "Analysis failed. Please try again." + reset button
- Non-JSON response: toast "Unexpected AI response format."
- Empty textarea: inline validation "Please paste a job description first."
- Empty `matched_skills` or `gaps`: show "None identified"

---

### Feature 2.2: Cover Letter Generator

**What the user sees:**
Card panel "Cover Letter Generator." Inputs: Company Name (text), Role Title (text), JD textarea (pre-filled from `jdText` if available). "Generate Cover Letter" button.

After generation: full-width editable textarea with generated text. Word count indicator below. "Copy to Clipboard" button + "Save to Application" button (job modal context only).

**Cache behavior:** If `job.coverLetter` exists, pre-populate the textarea with saved draft + "Saved draft from [date]" label. User can regenerate or overwrite.

**Data written:** `job.coverLetter` (current textarea content at time of save).

**Edge cases:**
- Company or Role empty: inline validation, block submission
- Clipboard API unavailable: select textarea text as fallback
- JD > 4000 chars: silently truncate to 3500 chars for the prompt

---

### Feature 2.3: Interview Prep

**What the user sees:**
Card panel "Interview Prep." JD textarea (pre-filled from `jdText`). Role type dropdown: Technical / Hybrid / Behavioral-Heavy (default: Hybrid). "Generate Questions" button.

After generation: two collapsible accordion sections — Technical Questions and Behavioral Questions. Numbered items; clicking a question text toggles the answer outline (indented box, different background tint). All items collapsed by default.

**Cache behavior:** If `job.interviewPrep` exists, show cached result with "Generated [date]" + "Regenerate" button.

**Data written:** `job.interviewPrep`.

**Edge cases:**
- Empty JD: inline validation
- `technical_questions` empty: show "No technical questions generated for this role type." in collapsed section header
- API error: toast + reset loading

---

## 7. Feature Specification — Tier 3 (Nice to Have)

### Feature 3.1: Follow-up Reminders

**Shown on Dashboard** below Recent Activity. Lists jobs where `lastActivity` > 7 days ago AND status is `applied` or `screening`. Each row: company, role, status badge, "X days since last activity" (amber 7–13 days, red 14+). "Mark as Followed Up" button sets `lastActivity` to now and persists.

Section hidden entirely if no qualifying jobs. No empty state shown.

---

### Feature 3.2: Weekly Summary Report

"Generate Weekly Report" button on Dashboard (above metric cards). Opens a modal with a plain-text formatted summary: apps this week, response rate, pipeline breakdown, top active companies. "Copy Report" button. Generated entirely from state — no AI call, no storage write.

---

### Feature 3.3: Export Data as JSON

"Export All Data" button in Settings panel (gear icon, sidebar footer). Creates a Blob from `JSON.stringify({ jobs, settings })`, generates download as `job-hunt-export-{YYYY-MM-DD}.json`. Creates temporary anchor element, triggers download, revokes object URL.

---

## 8. UI/UX Specification

### Aesthetic Direction

**Dark Ops Dashboard — "Mission Control meets Premium DevOps tooling"**

Not an HR app. This looks like something a cloud engineer built for themselves: dark background with structured data density, monospace elements for IDs and metrics, sharp geometry, and electric accent colors that reference terminal/CLI culture without looking like a retro hacker theme. Think Datadog, Grafana, or Vercel's dark mode — but more opinionated and personal. Status colors are semantic and strict. Interactive elements feel physical with clear hover/active states. The sidebar is narrow and icon-forward.

---

### Color Palette

| CSS Variable | Hex | Usage |
|---|---|---|
| `--color-bg-base` | `#080C14` | App background (deepest layer) |
| `--color-bg-surface` | `#0F1523` | Cards, modals, panels |
| `--color-bg-elevated` | `#16203A` | Hover states, active sidebar items |
| `--color-border` | `#1E2D4A` | All borders, dividers |
| `--color-border-subtle` | `#142038` | Subtle separators |
| `--color-text-primary` | `#E8EDF5` | Headings, primary content |
| `--color-text-secondary` | `#7A8FA6` | Labels, metadata, muted text |
| `--color-text-ghost` | `#3D5270` | Placeholder text, disabled states |
| `--color-accent-cyan` | `#00C8FF` | Primary interactive, links, focus rings |
| `--color-accent-cyan-dim` | `#003D5C` | Cyan button backgrounds (dark variant) |
| `--color-accent-emerald` | `#10B981` | Success, "offer" status, positive metrics |
| `--color-accent-emerald-dim` | `#052E1E` | Emerald tinted backgrounds |
| `--color-accent-amber` | `#F59E0B` | Warnings, "screening" status, follow-up alerts |
| `--color-accent-amber-dim` | `#2E1E00` | Amber tinted backgrounds |
| `--color-accent-red` | `#EF4444` | Errors, "rejected" status, danger actions |
| `--color-accent-red-dim` | `#2E0A0A` | Red tinted backgrounds |
| `--color-accent-violet` | `#8B5CF6` | "Interview" status, AI feature accents |
| `--color-accent-violet-dim` | `#1A0E33` | Violet tinted backgrounds |
| `--color-accent-slate` | `#475569` | "Ghosted" status, neutral states |

### Kanban Column Accent Colors (top border)

| Column | Hex |
|---|---|
| Saved | `#475569` |
| Applied | `#00C8FF` |
| Screening | `#F59E0B` |
| Interview | `#8B5CF6` |
| Offer | `#10B981` |
| Rejected | `#EF4444` |
| Ghosted | `#334155` |

---

### Typography

**Display / Headings:** [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) — weights 400, 500, 700
Used for: all headings h1–h4, app logo, metric numbers, card company names.

**Body / UI:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) — weights 300, 400, 500
Used for: body text, labels, notes, button labels, form inputs, dropdown options.

**Monospace / Data:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) — weights 400, 500
Used for: job IDs, fit score numbers, day-count values, timestamps, JSON output, logo sub-label.

### Type Scale

| Level | Size | Font | Weight | Usage |
|---|---|---|---|---|
| Display | 28px | Space Grotesk | Bold (700) | Hero metrics, large numbers |
| H1 | 22px | Space Grotesk | SemiBold (600) | Page titles |
| H2 | 18px | Space Grotesk | Medium (500) | Section headers, card titles |
| H3 | 15px | Space Grotesk | Medium (500) | Column headers, panel titles |
| Body | 14px | DM Sans | Regular (400) | All body text, notes |
| Label | 12px | DM Sans | Medium (500) | Uppercase labels, metadata, badges |
| Mono | 13px | JetBrains Mono | Regular (400) | Data values, IDs, timestamps |

---

### Layout Structure

**Overall structure:** Fixed left sidebar (64px collapsed / 220px expanded — toggle button) + main content area filling remaining viewport width. No top nav bar.

**Sidebar (left, fixed):**
- Top: App logo icon + name (expanded mode only)
- Navigation: Dashboard, Pipeline (Kanban), Applications (Table), AI Tools
- Bottom: Settings gear icon + GoalRing (mini, shows this week % in expanded mode)
- Expansion state: React state, not persisted

**Main content area:**
- 24px padding all sides
- Page header bar at top of each view: H1 page title (left) + contextual action buttons (right)
- Content below fills available height, scrollable

**Modal overlay:**
- Centered, max-width 760px, max-height 90vh, internally scrollable
- Dark backdrop 70% opacity
- Entry animation: translateY(+20px → 0) + opacity(0 → 1), 200ms ease-out
- Exit animation: opacity(1 → 0), 150ms
- Click outside to close (if no unsaved changes)

**Responsive:** Desktop-first, min 1024px. On narrower viewports, sidebar auto-collapses to icon-only. Kanban becomes horizontally scrollable (no wrapping).

---

### Component Inventory (35 components)

| Component | Type | Description |
|---|---|---|
| `App` | Root | Global state, storage layer, view routing |
| `Sidebar` | Navigation | Collapsible left nav |
| `NavItem` | Atom | Single nav link: icon + label + active state |
| `GoalRing` | Atom | SVG circular progress ring with center text |
| `DashboardView` | View | Dashboard page layout |
| `MetricCard` | Atom | Stat card: number + label + optional sub-ring |
| `StatusDonutChart` | Chart | Recharts PieChart for status distribution |
| `WeeklyBarChart` | Chart | Recharts BarChart for weekly application history |
| `RecentActivityList` | Compound | Last 5 modified jobs with relative timestamps |
| `FollowUpList` | Compound | Stale-application reminder list |
| `KanbanView` | View | Horizontal scrolling board container |
| `KanbanColumn` | Compound | Column header + card list + drop zone |
| `JobCard` | Atom | Compact job card for Kanban |
| `TableView` | View | Filterable sortable table |
| `TableFilters` | Compound | Search + dropdown filter row |
| `TableRow` | Atom | Single table row |
| `AIToolsView` | View | Container for all three AI panels |
| `JDAnalyzerPanel` | Feature | Full JD Analyzer UI |
| `FitScoreRing` | Atom | Animated SVG score ring (0–100) |
| `SkillPillRow` | Atom | Horizontally scrolling pill tag row |
| `CoverLetterPanel` | Feature | Cover letter generator UI |
| `InterviewPrepPanel` | Feature | Interview prep accordion UI |
| `AccordionItem` | Atom | Expandable Q+A row |
| `JobModal` | Overlay | Full job detail/edit/add modal |
| `JobForm` | Form | All job input fields |
| `ContactRow` | Atom | Single contact entry with fields |
| `AIResultsPanel` | Compound | Modal-embedded AI results (3 tabs) |
| `StatusBadge` | Atom | Colored status pill |
| `SourceBadge` | Atom | Source origin pill |
| `TagPill` | Atom | User-defined tag + optional remove button |
| `TagInput` | Atom | Pill input: type + enter to add |
| `Toast` | Atom | Single notification toast |
| `ToastContainer` | Compound | Fixed bottom-right toast queue renderer |
| `EmptyState` | Atom | Centered illustration + message + optional CTA |
| `ConfirmButton` | Atom | Two-step: click to arm, click to fire |

---

### Key Interaction Patterns

**Modals:**
Enter: slide up from +20px + fade in, 200ms ease-out. Exit: fade out, 150ms. Click outside to close if no unsaved changes. Unsaved changes: inline warning bar "You have unsaved changes" with "Discard" + "Keep Editing" — never use `window.confirm()`.

**Form validation:**
Inline error text below field in `#EF4444` at 12px. Required field asterisks in `#3D5270` turn red on failed submit. No full-form error banners. No `<form>` tags — onClick handlers only.

**Toast notifications:**
Fixed bottom-right. Stack vertically, newest on top. Three variants: success (emerald left border), error (red left border), info (cyan left border). Auto-dismiss after 4 seconds. Manual close X button. Enter: slide in from right +40px + fade in 150ms. Exit: slide right + fade 150ms.

**Drag and drop (Kanban):**
`onPointerDown` → store dragged job ID + origin column in state. `onPointerMove` → show ghost card (semi-transparent, follows pointer). `onPointerUp` over valid column → update status + persist. Drop target: highlighted cyan dashed border during active drag-over. Invalid drop target: no visual feedback, silently cancel.

**Optimistic updates:**
All CRUD: update React state immediately, then async persist. On storage failure: roll back state diff + show error toast. Never block UI waiting for storage write.

**Loading states (AI calls):**
Button label → "Analyzing…" / "Generating…" + Lucide `Loader2` with `animate-spin`. Input fields disabled (`cursor-not-allowed`). Output area: three pulsing gray rounded rectangle lines (CSS keyframe: `opacity 0.5→1→0.5`, 1.5s loop). Panel card: animated top border (accent color, 2s shimmer sweep). No blocking overlays.

---

### Empty States

| View | Icon | Heading | Subtext | CTA |
|---|---|---|---|---|
| Dashboard (0 apps) | Large `[ ]` brackets (styled) | "No applications yet" | "Your command center is ready. Start tracking your first opportunity." | "Add Your First Application" button |
| Kanban (all empty) | Centered overlay over board | "Pipeline is empty" | "Start tracking your applications to fill the pipeline." | "+ Add Job" button |
| Kanban column (empty) | Dashed border ghost card | — | "No applications here yet" | — |
| Table (0 data) | Same as Dashboard | "No applications yet" | "Add your first application to get started." | "Add Application" |
| Table (filtered, 0 results) | Inline between filters and rows | — | "No applications match these filters." | "Clear all filters" text link |

---

## 9. Component Tree

```
App
├── [state: jobs, settings, view, selectedJob, modalMode, modalDirty,
│         toasts, aiLoading, aiError, standaloneAI, tableFilters,
│         sidebarExpanded, storageReady]
│
├── Sidebar
│   ├── NavItem ×4 (Dashboard, Pipeline, Applications, AI Tools)
│   └── GoalRing (mini)
│
├── [view === 'dashboard'] DashboardView
│   ├── MetricCard ×4
│   ├── GoalRing (large, inside Applied This Week card)
│   ├── StatusDonutChart
│   ├── WeeklyBarChart
│   ├── RecentActivityList
│   └── FollowUpList
│
├── [view === 'kanban'] KanbanView
│   └── KanbanColumn ×7
│       └── JobCard ×n
│
├── [view === 'table'] TableView
│   ├── TableFilters
│   └── TableRow ×n
│
├── [view === 'ai-tools'] AIToolsView
│   ├── JDAnalyzerPanel
│   │   ├── FitScoreRing
│   │   └── SkillPillRow ×3 (matched, gaps, keywords)
│   ├── CoverLetterPanel
│   └── InterviewPrepPanel
│       └── AccordionItem ×n
│
├── [selectedJob !== null] JobModal
│   ├── JobForm
│   │   ├── TagInput
│   │   └── ContactRow ×n
│   └── [jdText exists] AIResultsPanel
│       ├── Tab: Analysis → AIAnalysis display (FitScoreRing + SkillPillRow)
│       ├── Tab: Cover Letter → coverLetter textarea
│       └── Tab: Interview Prep → AccordionItem ×n
│
└── ToastContainer
    └── Toast ×n
```

---

## 10. State Shape

```js
{
  // Persistence layer
  storageReady: false,                // bool — guards render until init load completes

  // Core data
  jobs: [],                           // Job[] — full loaded array
  settings: {
    name: '',
    weeklyGoal: 15,
    targetRoles: ['Cloud Engineer', 'DevOps Engineer', 'SRE'],
    targetLocations: ['Philippines', 'Remote']
  },

  // Navigation
  view: 'dashboard',                  // 'dashboard' | 'kanban' | 'table' | 'ai-tools'
  sidebarExpanded: true,              // bool

  // Modal state
  selectedJob: null,                  // Job | null
  modalMode: 'view',                  // 'add' | 'view' | 'edit'
  modalDirty: false,                  // bool — true if unsaved changes exist

  // Table state
  tableFilters: {
    search: '',
    statuses: [],                     // string[] — selected status filters
    sources: [],                      // string[] — selected source filters
    dateFrom: null,                   // string | null — ISO date
    dateTo: null,                     // string | null — ISO date
    sortColumn: 'lastActivity',       // string — column key
    sortDir: 'desc'                   // 'asc' | 'desc'
  },

  // AI loading and error state
  aiLoading: {
    'jd-analyzer': false,
    'cover-letter': false,
    'interview-prep': false
  },
  aiError: {
    'jd-analyzer': null,              // string | null
    'cover-letter': null,
    'interview-prep': null
  },

  // Standalone AI Tools view state (not attached to a specific job)
  standaloneAI: {
    jdText: '',
    company: '',
    role: '',
    roleType: 'Hybrid',               // 'Technical' | 'Hybrid' | 'Behavioral-Heavy'
    analysisResult: null,             // AIAnalysis | null
    coverLetterResult: null,          // string | null
    interviewPrepResult: null         // InterviewPrep | null
  },

  // Toast queue
  toasts: []
  // Each toast: { id: string, type: 'success'|'error'|'info', message: string, expiresAt: number }
}
```

---

## 11. API Call Patterns

### callClaude Wrapper (pseudocode)

```js
async function callClaude(promptText, featureKey, maxTokens = 1000) {
  setAiLoading(prev => ({ ...prev, [featureKey]: true }))
  setAiError(prev => ({ ...prev, [featureKey]: null }))

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: promptText }]
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.content[0].text.trim()
    const parsed = JSON.parse(text)          // throws if not valid JSON
    return parsed

  } catch (e) {
    if (e instanceof SyntaxError) {
      showToast('error', 'Unexpected AI response format.')
    } else {
      showToast('error', 'AI request failed. Please try again.')
    }
    setAiError(prev => ({ ...prev, [featureKey]: e.message }))
    return null
  } finally {
    setAiLoading(prev => ({ ...prev, [featureKey]: false }))
  }
}
```

### max_tokens per Feature

| Feature | max_tokens | Reason |
|---|---|---|
| JD Analyzer | `800` | Structured JSON, concise arrays |
| Cover Letter | `1200` | Prose output wrapped in JSON envelope |
| Interview Prep | `1500` | Two arrays × 5 questions each with answer outlines |

### Response Parsing

All prompts instruct Claude to return raw JSON with no markdown fences, no preamble, no trailing text. Parse with bare `JSON.parse(text.trim())`. On `SyntaxError`: show format error toast. On HTTP error: show generic retry toast. Always log raw text to console.error for debugging.

---

## 12. AI Prompt Templates

### User Background Context Block

This exact string is injected into every AI prompt. Store it as a constant in the app:

```
USER BACKGROUND:
- Fresh graduate with AWS certifications (AWS Certified Solutions Architect, AWS Certified DevOps Engineer)
- Core skills: AWS services (ECS Fargate, Lambda, EC2, S3, RDS, DynamoDB, CloudFront, CloudFormation, CDK, IAM, VPC), Docker, Kubernetes, Terraform, Ansible
- CI/CD: GitHub Actions, Jenkins, AWS CodePipeline
- Languages: Python, Bash, YAML; basic JavaScript
- Based in Philippines, applying to AWS Partner Network companies and multinational tech firms with PH presence
- Experience level: internship and academic projects in cloud infrastructure, containerization, infrastructure as code, monitoring (CloudWatch, Prometheus)
- Target roles: Cloud Engineer, DevOps Engineer, Site Reliability Engineer, Cloud Infrastructure Engineer
- Soft skills: documentation-oriented, collaborative in cross-functional teams, strong problem decomposition
```

---

### Prompt 1: JD Analyzer

**Feature key:** `'jd-analyzer'`
**max_tokens:** `800`
**Prompt construction:**

```js
const prompt = `You are a career advisor AI. Analyze the following job description against a candidate's background and return a fit assessment.

CANDIDATE BACKGROUND:
${USER_BACKGROUND_CONTEXT}

JOB DESCRIPTION:
${jdText}

Analyze the fit between the candidate and this role. Return ONLY a valid JSON object with NO markdown formatting, NO code fences, NO preamble, NO trailing text. The JSON must match this exact structure:

{
  "fit_score": <integer 0-100, overall fit percentage>,
  "matched_skills": [<array of strings: skills/technologies in the JD that the candidate has>],
  "gaps": [<array of strings: skills/technologies in the JD that the candidate is missing or weak in>],
  "keywords": [<array of strings: 8-12 resume optimization keywords extracted from the JD, prioritized by frequency and importance>]
}

Scoring guide:
- 80-100: Strong match, candidate has most required and preferred qualifications
- 60-79: Good match, candidate has core requirements but some gaps
- 40-59: Partial match, significant gaps but transferable skills present
- 0-39: Weak match, major skill misalignment

Be specific in matched_skills and gaps — use the exact technology names as written in the JD. Limit each array to a maximum of 10 items.`
```

**Response parsing:**
```js
const result = await callClaude(prompt, 'jd-analyzer', 800)
// result shape: { fit_score: number, matched_skills: string[], gaps: string[], keywords: string[] }
// Store as: { ...result, generatedAt: new Date().toISOString() }
```

---

### Prompt 2: Cover Letter Generator

**Feature key:** `'cover-letter'`
**max_tokens:** `1200`
**Prompt construction:**

```js
const truncatedJD = jdText.length > 3500 ? jdText.slice(0, 3500) : jdText

const prompt = `You are a professional cover letter writer specializing in tech roles. Write a tailored cover letter for the following application.

CANDIDATE BACKGROUND:
${USER_BACKGROUND_CONTEXT}

APPLICATION DETAILS:
- Company: ${company}
- Role: ${role}
- Job Description: ${truncatedJD}

Write a professional cover letter that:
1. Opens with a specific hook referencing the company or role (not a generic opener)
2. Highlights 2-3 most relevant AWS/DevOps skills that directly match requirements in the JD
3. References concrete examples from the candidate's background (use plausible specifics based on the background provided — cloud infrastructure projects, containerization work, IaC implementations)
4. Keeps a confident, professional tone without being arrogant
5. Is 3-4 paragraphs, approximately 250-320 words total
6. Ends with a specific call to action

Return ONLY a valid JSON object with NO markdown, NO code fences, NO preamble:

{
  "cover_letter": "<the complete cover letter text as a single string, with paragraph breaks as \\n\\n>",
  "key_points": [<array of 3 strings: the 3 main selling points emphasized in this letter>]
}`
```

**Response parsing:**
```js
const result = await callClaude(prompt, 'cover-letter', 1200)
// result shape: { cover_letter: string, key_points: string[] }
// Display result.cover_letter in textarea, replacing \\n\\n with actual newlines
// Store result.cover_letter as job.coverLetter
```

---

### Prompt 3: Interview Prep

**Feature key:** `'interview-prep'`
**max_tokens:** `1500`
**Prompt construction:**

```js
const questionCounts = {
  'Technical': '6 technical + 3 behavioral',
  'Hybrid': '4 technical + 4 behavioral',
  'Behavioral-Heavy': '2 technical + 6 behavioral'
}

const truncatedJD = jdText.length > 2500 ? jdText.slice(0, 2500) : jdText

const prompt = `You are a technical interview coach. Generate interview preparation questions based on a job description and candidate background.

CANDIDATE BACKGROUND:
${USER_BACKGROUND_CONTEXT}

JOB DESCRIPTION:
${truncatedJD}

INTERVIEW TYPE: ${roleType}
Question count: ${questionCounts[roleType]}

For each question, provide a suggested answer outline that:
- Is specific to the candidate's AWS/DevOps background
- Includes concrete talking points or frameworks (STAR method for behavioral, specific AWS services for technical)
- Is 2-4 sentences — an outline, not a full script

Return ONLY a valid JSON object with NO markdown, NO code fences, NO preamble:

{
  "technical_questions": [
    {
      "question": "<the interview question>",
      "suggested_answer": "<2-4 sentence answer outline with specific talking points>"
    }
  ],
  "behavioral_questions": [
    {
      "question": "<the interview question>",
      "suggested_answer": "<2-4 sentence STAR-format answer outline>"
    }
  ]
}

Technical questions must reference specific technologies mentioned in the JD. Behavioral questions must be drawn from common DevOps/cloud team scenarios (on-call, incident response, cross-team collaboration, learning new tech, handling ambiguity).`
```

**Response parsing:**
```js
const result = await callClaude(prompt, 'interview-prep', 1500)
// result shape: { technical_questions: PrepQuestion[], behavioral_questions: PrepQuestion[] }
// Validate both are arrays; default to [] if missing
// Store as: { ...result, generatedAt: new Date().toISOString() }
```

---

## 13. Build Plan

### Phase 1 — Foundation: Storage Layer + Data Model + CRUD
**Complexity: Medium**

1. Define ID generator utility: `generateId(prefix)` → `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
2. Define `USER_BACKGROUND_CONTEXT` constant string
3. Define default values for all entities
4. Implement `storageGet`, `storageSet`, `storageDelete` wrappers with try-catch
5. Implement app initialization sequence: read index → batch read jobs → read settings → setStorageReady
6. Implement `addJob(jobData)` — optimistic + async persist + rollback on failure
7. Implement `updateJob(id, changes)` — optimistic + async persist + rollback
8. Implement `deleteJob(id)` — optimistic + async persist (both key and index) + rollback
9. Implement `saveSettings(changes)` — optimistic + async persist
10. Implement `Toast` atom + `ToastContainer` + `showToast(type, message)` function
11. Implement `ConfirmButton` atom (two-step confirmation)
12. **Verify:** add job → refresh → confirm persists. Delete job → confirm gone from storage. Storage failure → confirm rollback + toast.

---

### Phase 2 — Core Views: Navigation + Kanban + Table
**Complexity: High**

1. Implement `Sidebar` with `NavItem`, view switching, collapse/expand toggle
2. Implement `StatusBadge`, `SourceBadge`, `TagPill` atoms with correct colors
3. Implement `JobCard` for Kanban (all fields, fit score dot)
4. Implement `KanbanColumn` with header, card list, drop zone, empty state ghost card
5. Implement `KanbanView` with horizontal scroll container, 7 columns
6. Implement drag-and-drop via pointer events (pointerDown/Move/Up) — ghost card + drop zone highlight
7. Implement `JobForm` with all fields, `TagInput`, `ContactRow`
8. Implement `JobModal` with view/edit/add modes, unsaved-changes guard (no window.confirm)
9. Wire modal open from JobCard click and "+ Add" button with correct modalMode
10. Implement `TableFilters` (search input with 150ms debounce + status/source multi-select dropdowns)
11. Implement `TableView` with `useMemo` for filtered+sorted rows, sortable column headers, `TableRow`
12. Implement `EmptyState` component
13. **Verify:** full CRUD cycle through both views. Drag card between columns, confirm status persists. Table filters work correctly.

---

### Phase 3 — Dashboard with Charts
**Complexity: Medium**

1. Implement `GoalRing` SVG component — props: `value`, `max`, `size`, `color`. Pure SVG, no Recharts.
2. Implement `MetricCard` atom
3. Implement all computed dashboard metrics (totalApps, thisWeekApps, responseRate, activePipeline)
4. Implement weekly history computation: last 8 ISO weeks, count apps by `dateApplied` per week
5. Implement `StatusDonutChart` with Recharts PieChart, custom tooltip, legend
6. Implement `WeeklyBarChart` with Recharts BarChart, ReferenceLine at weeklyGoal
7. Implement `RecentActivityList` with relative time formatting
8. Implement `FollowUpList` with "Mark as Followed Up" action
9. Wire donut segment click → navigate to Table view with status filter pre-applied
10. Compose `DashboardView` layout
11. Wire empty state to Dashboard, Kanban, Table
12. **Verify:** add apps from different weeks, confirm charts and metrics update correctly.

---

### Phase 4 — AI Features
**Complexity: Medium**

1. Implement `callClaude(promptText, featureKey, maxTokens)` wrapper function
2. Add `USER_BACKGROUND_CONTEXT` constant
3. Implement `JDAnalyzerPanel` — textarea, button, `FitScoreRing`, `SkillPillRow` ×3, Save action
4. Implement `CoverLetterPanel` — inputs, button, editable textarea output, Copy + Save
5. Implement `InterviewPrepPanel` — textarea + role type dropdown, button, `AccordionItem` accordion
6. Implement `AccordionItem` — toggle expand/collapse with answer outline
7. Implement `FitScoreRing` — SVG ring, color-coded by score tier (green/amber/red)
8. Implement `SkillPillRow` — horizontally scrollable pill tags with color prop
9. Implement `AIResultsPanel` inside `JobModal` — 3-tab panel (Analysis / Cover Letter / Interview Prep)
10. Wire "Analyze from modal" / "Generate from modal" to pre-fill `jdText`, save results to job
11. Wire Tier 3: FollowUpList "Mark as Followed Up" + Weekly Report modal + JSON Export
12. **Verify:** analyze JD → save to job → close modal → reopen → cached result shown with date. Regenerate works. All three AI tools produce valid parsed output.

---

### Phase 5 — Polish, Animations, Error Handling
**Complexity: Low–Medium**

1. Add modal slide-up entry/exit CSS transitions (transform + opacity keyframes)
2. Add AI output shimmer loading placeholder animation (pulsing gray lines keyframe)
3. Add Kanban drag ghost card visual (pointer position clone, semi-transparent)
4. Add toast enter (slide-in from right) + exit (slide-out right) animations
5. Add Kanban column drop-zone border highlight during active drag
6. Add focus ring styles on all interactive elements (`outline: 2px solid #00C8FF`)
7. Add `storageReady === false` full-screen loading state (spinner + "Loading your command center…")
8. Implement `SettingsPanel` overlay (name, weeklyGoal, targetRoles, export button)
9. Audit all `aiLoading` states — every AI call disables inputs and restores correctly
10. Audit all error paths — every storage write failure shows toast and rolls back state
11. Verify line count is under 3000 — extract repeated JSX patterns into components if needed
12. Final walkthrough: all three tiers, all empty states, all error states, all loading states
