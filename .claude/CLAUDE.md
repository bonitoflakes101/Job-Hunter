# Job Hunt Command Center — Claude Project Instructions

## What this project is

A single-file React `.jsx` artifact app — a personal job hunt dashboard with AI-powered tools (JD fit analyzer, cover letter generator, interview prep) built for Claude's artifact system. The user is a fresh AWS/DevOps graduate in the Philippines running a high-volume job search.

---

## MOST IMPORTANT RULE

**This is ONE file. NEVER split into multiple files.**
NEVER create additional `.jsx`, `.js`, `.ts`, or `.css` files.
All 3000 lines of code live in a single artifact file.

---

## Technical constraints (non-negotiable)

### Storage — ONLY mechanism for persistence
```js
window.storage.get(key, defaultValue)  // async — always await
window.storage.set(key, value)         // async — always await
window.storage.delete(key)             // async — always await
window.storage.list(prefix)           // async — always await
```
- All storage calls are async and can fail — **always wrap in try-catch**
- Use hierarchical keys: `jobs:index`, `jobs:{id}`, `settings:profile`
- **NEVER use `localStorage` or `sessionStorage`** — not supported in this environment

### Imports — ONLY these are available
```js
import { useState, useEffect, useReducer, useRef, useMemo, useCallback } from 'react'
import { /* icons */ } from 'lucide-react'
import { PieChart, BarChart, /* etc */ } from 'recharts'
import _ from 'lodash'
import { /* components */ } from '@/components/ui'  // shadcn/ui
```

### Claude-in-Claude AI calls
```js
const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  })
})
```
- No API key needed
- Always instruct Claude to return **raw JSON only** — no markdown fences, no preamble
- Use max_tokens: 800 (JD Analyzer), 1200 (Cover Letter), 1500 (Interview Prep)

### Other hard rules
- **No `<form>` tags** — use `onClick`/`onChange` handlers only
- Under 3000 lines total

---

## Aesthetic direction

**Dark Ops Dashboard** — deep navy backgrounds (`#080C14` base, `#0F1523` surface), electric cyan (`#00C8FF`) primary accent, emerald (`#10B981`) success states. Fonts: Space Grotesk (headings), DM Sans (body), JetBrains Mono (data/numbers). This is NOT a generic corporate dashboard — it looks like Datadog or Grafana's dark mode, built personally by a cloud engineer.

---

## Behavior rules for Claude

- Make **ONLY the changes explicitly requested**. Do not refactor, add features, or clean up unrelated code.
- When writing AI prompts in code: always instruct Claude to return raw JSON with no markdown fences, no preamble. Parse with bare `JSON.parse(text.trim())`.
- When touching storage: always use try-catch, always update `jobs:index` on add/delete, always optimistic-update state first then rollback on failure.
- When adding a component: check the 35-component inventory in `MASTER.md` before creating a new one — it may already be defined.
- Never use `window.confirm()` or `alert()` — use the Toast system and inline confirmation patterns instead.
- Always set `job.lastActivity = new Date().toISOString()` when any job field is updated.

---

## Skills for this project

Use these skills when making decisions during the build:

| Task | Skill |
|---|---|
| Writing or refining an AI prompt used inside the app | `/prompt-master` |
| UI component design, layout decisions, color system questions | `/ui-ux-pro-max` |

---

## Full reference

See `MASTER.md` in the project root for:
- Complete data model (all entities, all fields, all types)
- Storage key schema + read/write/rollback strategies
- All 35 components with descriptions
- Complete color palette (17 variables with hex values)
- Typography scale (3 fonts, 6 levels)
- All feature specs (Tier 1 / Tier 2 / Tier 3) with edge cases
- Exact AI prompt strings (copy-paste ready)
- Full 5-phase build plan
