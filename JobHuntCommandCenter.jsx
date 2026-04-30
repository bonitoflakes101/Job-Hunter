import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Loader2, X, CheckCircle, AlertCircle, Info, Trash2,
  LayoutDashboard, Columns, List, Zap, Settings,
  ChevronLeft, ChevronRight, Plus, Search, ExternalLink,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, Star,
  FileText, Pencil, GripVertical, Check, Bell, Sun, Moon
} from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const USER_BACKGROUND_CONTEXT = `USER BACKGROUND:
- Fresh graduate with AWS certifications (AWS Certified Solutions Architect, AWS Certified DevOps Engineer)
- Core skills: AWS services (ECS Fargate, Lambda, EC2, S3, RDS, DynamoDB, CloudFront, CloudFormation, CDK, IAM, VPC), Docker, Kubernetes, Terraform, Ansible
- CI/CD: GitHub Actions, Jenkins, AWS CodePipeline
- Languages: Python, Bash, YAML; basic JavaScript
- Based in Philippines, applying to AWS Partner Network companies and multinational tech firms with PH presence
- Experience level: internship and academic projects in cloud infrastructure, containerization, infrastructure as code, monitoring (CloudWatch, Prometheus)
- Target roles: Cloud Engineer, DevOps Engineer, Site Reliability Engineer, Cloud Infrastructure Engineer
- Soft skills: documentation-oriented, collaborative in cross-functional teams, strong problem decomposition`

const DARK = {
  bgBase:        '#09090B',
  bgSurface:     '#111113',
  bgElevated:    '#1C1C1F',
  border:        '#27272A',
  borderSubtle:  '#18181B',
  textPrimary:   '#FAFAFA',
  textSecondary: '#A1A1AA',
  textGhost:     '#52525B',
  cyan:          '#38BDF8',
  cyanDim:       '#0C2233',
  emerald:       '#34D399',
  emeraldDim:    '#052E1E',
  amber:         '#FBBF24',
  amberDim:      '#2D1F00',
  red:           '#F87171',
  redDim:        '#2D0A0A',
  violet:        '#A78BFA',
  violetDim:     '#1E1040',
  slate:         '#3F3F46',
  shadow:        'none',
}

const LIGHT = {
  bgBase:        '#F4F4F5',
  bgSurface:     '#FFFFFF',
  bgElevated:    '#F9F9F9',
  border:        '#E4E4E7',
  borderSubtle:  '#F0F0F1',
  textPrimary:   '#09090B',
  textSecondary: '#52525B',
  textGhost:     '#A1A1AA',
  cyan:          '#0284C7',
  cyanDim:       '#E0F2FE',
  emerald:       '#059669',
  emeraldDim:    '#ECFDF5',
  amber:         '#D97706',
  amberDim:      '#FFFBEB',
  red:           '#DC2626',
  redDim:        '#FEF2F2',
  violet:        '#7C3AED',
  violetDim:     '#F5F3FF',
  slate:         '#D4D4D8',
  shadow:        '0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)',
}

let _themeColors = DARK
const C = new Proxy({}, { get: (_, key) => _themeColors[key] })

const STATUS_CONFIG = {
  saved:     { label: 'Saved',     get color() { return C.textSecondary }, dim: 'rgba(113,113,122,0.10)' },
  applied:   { label: 'Applied',   get color() { return C.cyan },          dim: 'rgba(56,189,248,0.12)'  },
  screening: { label: 'Screening', get color() { return C.amber },         dim: 'rgba(251,191,36,0.12)'  },
  interview: { label: 'Interview', get color() { return C.violet },        dim: 'rgba(167,139,250,0.12)' },
  offer:     { label: 'Offer',     get color() { return C.emerald },       dim: 'rgba(52,211,153,0.12)'  },
  rejected:  { label: 'Rejected',  get color() { return C.red },           dim: 'rgba(248,113,113,0.12)' },
  ghosted:   { label: 'Ghosted',   get color() { return C.textGhost },     dim: 'rgba(82,82,91,0.10)'    },
}

const STATUSES = Object.keys(STATUS_CONFIG)
const SOURCES = ['JobStreet', 'LinkedIn', 'Indeed', 'AWS Partner Network', 'Company Website', 'Referral', 'Other']
const ACTIVE_STATUSES = ['applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted']

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT VALUES
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  name: '',
  weeklyGoal: 15,
  targetRoles: ['Cloud Engineer', 'DevOps Engineer', 'SRE'],
  targetLocations: ['Philippines', 'Remote'],
  resume: '',
}

const DEFAULT_JOB = {
  company: '',
  role: '',
  url: '',
  source: 'LinkedIn',
  status: 'saved',
  dateSaved: null,
  dateApplied: null,
  lastActivity: null,
  salary: { min: null, max: null, currency: 'PHP' },
  notes: '',
  contacts: [],
  tags: [],
  jdText: '',
  aiAnalysis: null,
  coverLetter: null,
  interviewPrep: null,
  followUpEmail: null,
}

const DEFAULT_CONTACT = { id: '', name: '', role: '', email: '', linkedin: '', notes: '' }

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE WRAPPERS
// ─────────────────────────────────────────────────────────────────────────────

const storageGet = async (key, defaultValue = null) => {
  try { return await window.storage.get(key, defaultValue) }
  catch (e) { console.error(`[storage:get] key="${key}"`, e); return defaultValue }
}

const storageSet = async (key, value) => {
  try { await window.storage.set(key, value); return true }
  catch (e) { console.error(`[storage:set] key="${key}"`, e); return false }
}

const storageDelete = async (key) => {
  try { await window.storage.delete(key); return true }
  catch (e) { console.error(`[storage:delete] key="${key}"`, e); return false }
}

// ─────────────────────────────────────────────────────────────────────────────
// AI WRAPPER
// ─────────────────────────────────────────────────────────────────────────────

const AI_URL = '/api/groq/openai/v1/chat/completions'
const AI_MODEL = 'llama-3.3-70b-versatile'

async function callAI(promptText, featureKey, maxTokens, setAiLoading, setAiError, showToast) {
  setAiLoading(prev => ({ ...prev, [featureKey]: true }))
  setAiError(prev => ({ ...prev, [featureKey]: null }))
  try {
    const res = await fetch(AI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: promptText }]
      })
    })
    if (!res.ok) { const err = await res.text(); throw new Error(`API ${res.status}: ${err}`) }
    const data = await res.json()
    const raw = data.choices[0].message.content.trim()
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const match = jsonStr.match(/[\[{][\s\S]*[\]}]/)
    return JSON.parse(match ? match[0] : jsonStr)
  } catch (e) {
    console.error('[callAI]', featureKey, e)
    if (e instanceof SyntaxError) showToast('error', 'Unexpected AI response format.')
    else showToast('error', 'AI request failed. Please try again.')
    setAiError(prev => ({ ...prev, [featureKey]: e.message }))
    return null
  } finally {
    setAiLoading(prev => ({ ...prev, [featureKey]: false }))
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.slice(0, 10).split('-')
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`
}

const daysAgo = (dateStr) => {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

const getDaysActive = (job) => {
  if (['rejected', 'ghosted'].includes(job.status)) return null
  return daysAgo(job.dateApplied || job.dateSaved)
}

const timeAgo = (isoStr) => {
  if (!isoStr) return '—'
  const mins = Math.floor((Date.now() - new Date(isoStr).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Returns last N ISO weeks (Mon–Sun) with applied-job count per week
const getWeeklyHistory = (jobs, weekCount = 8) => {
  const now = new Date()
  const currentDay = now.getDay() || 7 // Mon=1 … Sun=7
  const thisMonday = new Date(now)
  thisMonday.setDate(now.getDate() - currentDay + 1)
  thisMonday.setHours(0, 0, 0, 0)

  return Array.from({ length: weekCount }, (_, i) => {
    const weekStart = new Date(thisMonday)
    weekStart.setDate(thisMonday.getDate() - (weekCount - 1 - i) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = jobs.filter(j => {
      if (!j.dateApplied) return false
      const d = new Date(j.dateApplied)
      return d >= weekStart && d < weekEnd
    }).length

    const label = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`
    return { label, count }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; -webkit-font-smoothing: antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #3F3F46; border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: #52525B; }
  button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid #38BDF8; outline-offset: 2px; }
  button { cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  input, textarea, select { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes slideInRight { from { transform: translateX(40px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes shimmer { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  /* ── Responsive layout ── */
  .r-dash { padding: 28px; flex: 1; overflow: auto; }
  .r-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .r-grid3-mb { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px; }
  .r-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
  .r-stats > div + div { border-left: 1px solid; border-color: var(--border-color); padding-left: 24px; }
  .r-view-hdr { padding: 20px 24px 14px; flex-shrink: 0; }
  .r-view-board { flex: 1; overflow-x: auto; overflow-y: hidden; padding: 0 24px 24px; display: flex; gap: 12px; align-items: flex-start; }
  .r-table-body { flex: 1; overflow: auto; padding: 0 24px 24px; }
  .r-pipeline { display: grid; gap: 14px; }

  @media (max-width: 1100px) {
    .r-grid3 { grid-template-columns: repeat(2, 1fr); }
    .r-grid3-mb { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 900px) {
    .r-pipeline { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 768px) {
    .r-dash { padding: 16px; }
    .r-view-hdr { padding: 12px 14px 10px; }
    .r-view-board { padding: 0 14px 14px; }
    .r-table-body { padding: 0 14px 14px; }
    .r-stats { grid-template-columns: 1fr; }
    .r-stats > div + div { border-left: none; border-top: 1px solid; border-color: var(--border-color); padding-left: 0; padding-top: 16px; margin-top: 16px; }
  }
  @media (max-width: 640px) {
    .r-grid3 { grid-template-columns: 1fr; }
    .r-grid3-mb { grid-template-columns: 1fr; }
  }
`

function useWindowWidth() {
  const [w, setW] = useState(() => window.innerWidth)
  useEffect(() => {
    const handler = () => setW(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return w
}

// ─────────────────────────────────────────────────────────────────────────────
// ATOMS
// ─────────────────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: C.bgBase, gap: '16px' }}>
      <style>{GLOBAL_STYLES}</style>
      <Loader2 size={32} color={C.cyan} style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: C.textSecondary, fontSize: '14px' }}>Loading your command center…</p>
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const META = { success: { color: C.emerald, Icon: CheckCircle }, error: { color: C.red, Icon: AlertCircle }, info: { color: C.cyan, Icon: Info } }
  const { color, Icon } = META[toast.type] || META.info
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: C.bgSurface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`, borderRadius: '6px', color: C.textPrimary, fontSize: '13px', minWidth: '260px', maxWidth: '380px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'slideInRight 0.15s ease-out' }}>
      <Icon size={15} color={color} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} style={{ background: 'none', border: 'none', color: C.textGhost, padding: '2px', display: 'flex', alignItems: 'center' }}>
        <X size={13} />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', bottom: '84px', right: '24px', display: 'flex', flexDirection: 'column-reverse', gap: '8px', zIndex: 9999, pointerEvents: 'none' }}>
      {toasts.map(t => <div key={t.id} style={{ pointerEvents: 'all' }}><Toast toast={t} onDismiss={onDismiss} /></div>)}
    </div>
  )
}

function ConfirmButton({ label, confirmLabel = 'Confirm?', onConfirm, style: s = {} }) {
  const [armed, setArmed] = useState(false)
  const timer = useRef(null)
  const arm = () => { setArmed(true); timer.current = setTimeout(() => setArmed(false), 3000) }
  const fire = () => { clearTimeout(timer.current); setArmed(false); onConfirm() }
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button onClick={armed ? fire : arm} style={{ background: armed ? C.red : C.redDim, color: armed ? '#fff' : C.red, border: `1px solid ${C.red}`, borderRadius: '6px', padding: '7px 14px', fontSize: '13px', fontWeight: 500, transition: 'background 0.15s, color 0.15s', display: 'flex', alignItems: 'center', gap: '6px', ...s }}>
      <Trash2 size={13} />
      {armed ? confirmLabel : label}
    </button>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.saved
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500, letterSpacing: '0.02em', background: cfg.dim, color: cfg.color, border: `1px solid ${cfg.color}33`, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

// GoalRing — pure SVG circular progress ring, no Recharts
function GoalRing({ value, max, size = 80, strokeWidth = 8 }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const color = pct >= 1 ? C.emerald : pct >= 0.5 ? C.amber : C.red
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bgElevated} strokeWidth={strokeWidth} />
      {/* Progress — starts at 12 o'clock via rotation on the element */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${pct * circ} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
      {/* Center value */}
      <text
        x={cx} y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
      >
        {value}
      </text>
    </svg>
  )
}

// MetricCard — single KPI tile
function MetricCard({ label, value, sub, color, ring }) {
  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px 20px', boxShadow: C.shadow }}>
      <p style={{ fontSize: '11px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '10px' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '32px', fontWeight: 700, color: color || C.textPrimary, lineHeight: 1 }}>{value}</p>
        {ring && ring}
      </div>
      {sub && <p style={{ fontSize: '12px', color: C.textSecondary, marginTop: '6px' }}>{sub}</p>}
    </div>
  )
}

function FitScoreRing({ score, size = 88 }) {
  const sw = 9
  const color = score >= 70 ? C.emerald : score >= 40 ? C.amber : C.red
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2, cy = size / 2
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.bgElevated} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeLinecap="round" strokeDasharray={`${(score / 100) * circ} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size * 0.26} fontFamily="'JetBrains Mono', monospace" fontWeight="700">{score}</text>
      <text x={cx} y={cy + size * 0.17} textAnchor="middle" dominantBaseline="middle"
        fill={C.textGhost} fontSize={size * 0.12} fontFamily="'Plus Jakarta Sans', sans-serif">FIT</text>
    </svg>
  )
}

function SkillPillRow({ skills, color, emptyText }) {
  if (!skills?.length) return <p style={{ fontSize: '12px', color: C.textGhost, fontStyle: 'italic' }}>{emptyText || 'None identified'}</p>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
      {skills.map((s, i) => (
        <span key={i} style={{ padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: `${color}22`, color, border: `1px solid ${color}44` }}>{s}</span>
      ))}
    </div>
  )
}

function AccordionItem({ question, answer, index, tip }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
      <button onClick={() => setOpen(p => !p)} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: C.textGhost, flexShrink: 0, marginTop: '2px' }}>{String(index + 1).padStart(2, '0')}</span>
        <span style={{ flex: 1, fontSize: '13px', color: C.textPrimary, fontWeight: 500, lineHeight: 1.4 }}>{question}</span>
        <ChevronDown size={13} style={{ color: C.textGhost, flexShrink: 0, marginTop: '3px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div style={{ padding: '6px 0 12px 26px', marginBottom: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: C.bgBase, borderRadius: '5px', padding: '10px 12px' }}>
            <p style={{ fontSize: '12px', color: C.textSecondary, lineHeight: 1.7 }}>{answer}</p>
          </div>
          {tip && (
            <div style={{ background: C.amberDim, border: `1px solid ${C.amber}22`, borderLeft: `3px solid ${C.amber}`, borderRadius: '5px', padding: '8px 12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', color: C.amber, fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>STRATEGY</span>
              <p style={{ fontSize: '11px', color: C.amber, lineHeight: 1.6, opacity: 0.85 }}>{tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AIShimmer() {
  return (
    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[100, 80, 60].map((w, i) => (
        <div key={i} style={{ height: '10px', borderRadius: '5px', background: C.bgElevated, width: `${w}%`, animation: 'shimmer 1.5s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  )
}

function SourceBadge({ source }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 500, letterSpacing: '0.04em', background: C.bgElevated, color: C.textGhost, border: `1px solid ${C.border}`, whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
      {source}
    </span>
  )
}

function TagPill({ tag, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}33`, whiteSpace: 'nowrap' }}>
      {tag}
      {onRemove && (
        <button onClick={() => onRemove(tag)} style={{ background: 'none', border: 'none', color: C.cyan, padding: 0, display: 'flex', lineHeight: 1 }}>
          <X size={10} />
        </button>
      )}
    </span>
  )
}

function TagInput({ tags = [], onChange, readOnly }) {
  const [input, setInput] = useState('')
  const addTag = () => {
    const t = input.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', minHeight: '36px', padding: '6px 10px', background: readOnly ? C.bgSurface : C.bgBase, border: `1px solid ${C.border}`, borderRadius: '6px' }}>
      {tags.map(t => <TagPill key={t} tag={t} onRemove={readOnly ? null : (tag) => onChange(tags.filter(x => x !== tag))} />)}
      {!readOnly && (
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
          onBlur={addTag}
          placeholder={tags.length ? '' : 'Add tag…'}
          style={{ background: 'none', border: 'none', outline: 'none', color: C.textPrimary, fontSize: '12px', minWidth: '80px', flex: 1 }}
        />
      )}
    </div>
  )
}

function EmptyState({ icon: Icon = FileText, title, subtitle, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: C.bgSurface, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={C.textGhost} />
      </div>
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '16px', fontWeight: 600, color: C.textPrimary }}>{title}</p>
      {subtitle && <p style={{ fontSize: '13px', color: C.textSecondary, maxWidth: '300px', lineHeight: 1.5 }}>{subtitle}</p>}
      {action && onAction && (
        <button onClick={onAction} style={{ marginTop: '4px', background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}`, borderRadius: '6px', padding: '9px 20px', fontSize: '13px', fontWeight: 500 }}>
          {action}
        </button>
      )}
    </div>
  )
}

function MultiSelect({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const toggle = (val) => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: selected.length ? C.bgElevated : C.bgSurface, border: `1px solid ${selected.length ? C.cyan : C.border}`, borderRadius: '6px', color: selected.length ? C.cyan : C.textSecondary, fontSize: '12px', whiteSpace: 'nowrap' }}>
        {selected.length ? `${label} (${selected.length})` : label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200, background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px', minWidth: '180px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {options.map(opt => (
            <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', color: C.textPrimary, background: selected.includes(opt) ? C.bgElevated : 'transparent' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', border: `1px solid ${selected.includes(opt) ? C.cyan : C.border}`, background: selected.includes(opt) ? C.cyan : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {selected.includes(opt) && <Check size={9} color={C.bgBase} strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} style={{ display: 'none' }} />
              {opt}
            </label>
          ))}
          {selected.length > 0 && (
            <button onClick={() => onChange([])} style={{ width: '100%', marginTop: '4px', padding: '6px', background: 'none', border: 'none', color: C.textGhost, fontSize: '11px', textAlign: 'center', borderTop: `1px solid ${C.borderSubtle}` }}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function SettingsPanel({ settings, saveSettings, jobs, onClose, onImport }) {
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const importRef = useRef(null)
  const dirty = JSON.stringify(form) !== JSON.stringify(settings)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    await saveSettings(form)
    setSaving(false)
    onClose()
  }

  const exportJSON = () => {
    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify({ jobs, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `job-hunt-export-${date}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!data.jobs || !Array.isArray(data.jobs)) throw new Error('Invalid format')
        await onImport(data)
        onClose()
      } catch { /* onImport shows toast */ }
      setImporting(false)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const labelStyle = { fontSize: '11px', color: C.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'block' }
  const inputStyle = { width: '100%', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '9px 12px', color: C.textPrimary, fontSize: '13px', boxSizing: 'border-box' }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: '480px', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '12px', zIndex: 1001, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'slideUp 0.2s ease-out', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '16px', color: C.textPrimary, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={16} style={{ color: C.cyan }} /> Settings
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textGhost, padding: '4px', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          <div>
            <label style={labelStyle}>Your Name</label>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Juan dela Cruz" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Weekly Application Goal</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => set('weeklyGoal', Math.max(1, (form.weeklyGoal || 1) - 1))}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgBase, color: C.textPrimary, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', fontWeight: 700, color: C.cyan, minWidth: '40px', textAlign: 'center' }}>{form.weeklyGoal}</span>
              <button onClick={() => set('weeklyGoal', (form.weeklyGoal || 0) + 1)}
                style={{ width: '32px', height: '32px', borderRadius: '6px', border: `1px solid ${C.border}`, background: C.bgBase, color: C.textPrimary, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
              <span style={{ fontSize: '12px', color: C.textGhost }}>applications / week</span>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Target Roles</label>
            <TagInput tags={form.targetRoles || []} onChange={v => set('targetRoles', v)} />
            <p style={{ fontSize: '11px', color: C.textGhost, marginTop: '5px' }}>Type a role and press Enter to add</p>
          </div>

          <div>
            <label style={labelStyle}>Target Locations</label>
            <TagInput tags={form.targetLocations || []} onChange={v => set('targetLocations', v)} />
          </div>

          <div>
            <label style={labelStyle}>Your Resume / CV</label>
            <textarea value={form.resume || ''} onChange={e => set('resume', e.target.value)}
              placeholder="Paste your resume text here. The AI will use it to auto-score job fit…"
              rows={5}
              style={{ ...inputStyle, lineHeight: 1.5, resize: 'vertical' }} />
            <p style={{ fontSize: '11px', color: C.textGhost, marginTop: '4px' }}>Used by JD Fit Analyzer for personalized scoring.</p>
          </div>

          <div style={{ paddingTop: '4px', borderTop: `1px solid ${C.borderSubtle}` }}>
            <label style={{ ...labelStyle, marginBottom: '10px' }}>Data</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={exportJSON} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '7px', color: C.textSecondary, fontSize: '13px' }}>
                <ArrowDown size={13} /> Export JSON
              </button>
              <button onClick={() => importRef.current?.click()} disabled={importing}
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '7px', color: C.textSecondary, fontSize: '13px', opacity: importing ? 0.6 : 1 }}>
                <ArrowUp size={13} /> {importing ? 'Importing…' : 'Import JSON'}
              </button>
              <input ref={importRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </div>
            <p style={{ fontSize: '11px', color: C.textGhost, marginTop: '6px' }}>{jobs.length} application{jobs.length !== 1 ? 's' : ''} in your tracker</p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.textSecondary, fontSize: '13px' }}>Cancel</button>
          <button onClick={handleSave} disabled={!dirty || saving}
            style={{ padding: '8px 20px', background: dirty ? C.cyan : C.bgElevated, border: 'none', borderRadius: '6px', color: dirty ? C.bgBase : C.textGhost, fontSize: '13px', fontWeight: 600, cursor: dirty ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'kanban',     label: 'Pipeline',     Icon: Columns },
  { id: 'table',      label: 'Applications', Icon: List },
  { id: 'ai-tools',   label: 'AI Tools',     Icon: Zap },
]

function NavItem({ item, active, expanded, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={!expanded ? item.label : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: expanded ? '9px 12px' : '9px', borderRadius: '8px', border: 'none', width: '100%', background: active ? C.bgElevated : hovered ? `${C.bgElevated}88` : 'transparent', color: active ? C.cyan : C.textSecondary, fontSize: '13px', fontWeight: active ? 500 : 400, transition: 'background 0.12s, color 0.12s', position: 'relative' }}
    >
      {active && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '16px', background: C.cyan, borderRadius: '0 2px 2px 0' }} />}
      <item.Icon size={16} style={{ flexShrink: 0 }} />
      {expanded && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.label}</span>}
    </button>
  )
}

function Sidebar({ view, setView, expanded, setExpanded, jobs, onSettingsOpen, theme, onThemeToggle }) {
  const [settingsHovered, setSettingsHovered] = useState(false)
  const [themeHovered, setThemeHovered] = useState(false)
  const [collapseHovered, setCollapseHovered] = useState(false)
  return (
    <aside style={{ width: expanded ? '220px' : '64px', flexShrink: 0, background: C.bgSurface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', transition: 'width 0.2s ease', overflow: 'hidden' }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px', height: '60px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '16px', color: C.cyan, flexShrink: 0 }}>⌘</span>
        {expanded && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '13px', color: C.textPrimary, whiteSpace: 'nowrap' }}>JHCC</p>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: C.textGhost, whiteSpace: 'nowrap' }}>{jobs.length} tracked</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={view === item.id} expanded={expanded} onClick={() => setView(item.id)} />
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <button
          onClick={onSettingsOpen}
          onMouseEnter={() => setSettingsHovered(true)}
          onMouseLeave={() => setSettingsHovered(false)}
          title={!expanded ? 'Settings' : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: expanded ? '9px 12px' : '9px', borderRadius: '8px', border: 'none', width: '100%', background: settingsHovered ? C.bgElevated : 'transparent', color: C.textGhost, fontSize: '13px', transition: 'background 0.12s' }}
        >
          <Settings size={16} style={{ flexShrink: 0 }} />
          {expanded && <span style={{ whiteSpace: 'nowrap' }}>Settings</span>}
        </button>
        <button
          onClick={onThemeToggle}
          onMouseEnter={() => setThemeHovered(true)}
          onMouseLeave={() => setThemeHovered(false)}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: expanded ? '9px 12px' : '9px', borderRadius: '8px', border: 'none', width: '100%', background: themeHovered ? C.bgElevated : 'transparent', color: C.textGhost, fontSize: '13px', transition: 'background 0.12s' }}
        >
          {theme === 'dark' ? <Sun size={16} style={{ flexShrink: 0 }} /> : <Moon size={16} style={{ flexShrink: 0 }} />}
          {expanded && <span style={{ whiteSpace: 'nowrap' }}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>
        <button
          onClick={() => setExpanded(p => !p)}
          onMouseEnter={() => setCollapseHovered(true)}
          onMouseLeave={() => setCollapseHovered(false)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '9px', borderRadius: '8px', border: 'none', width: '100%', background: collapseHovered ? C.bgElevated : 'transparent', color: C.textGhost, fontSize: '11px', transition: 'background 0.12s' }}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <><ChevronLeft size={14} /><span>Collapse</span></> : <ChevronRight size={14} />}
        </button>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KANBAN
// ─────────────────────────────────────────────────────────────────────────────

function JobCard({ job, onPointerDown, isDragging }) {
  const days = getDaysActive(job)
  const scoreTier = job.aiAnalysis
    ? job.aiAnalysis.fit_score >= 70 ? C.emerald : job.aiAnalysis.fit_score >= 40 ? C.amber : C.red
    : null
  return (
    <div
      onPointerDown={onPointerDown}
      style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px', cursor: 'grab', opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.1s', userSelect: 'none', touchAction: 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '13px', color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</p>
          <p style={{ fontSize: '11px', color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{job.role}</p>
        </div>
        {scoreTier && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: scoreTier, flexShrink: 0, marginTop: '3px' }} title={`Fit: ${job.aiAnalysis.fit_score}`} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <SourceBadge source={job.source} />
        {days !== null && (
          <span style={{ fontSize: '10px', color: days > 14 ? C.amber : C.textGhost, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
            {days}d
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ status, jobs, isDragOver, onAddClick, onPointerDown, draggingJobId }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div
      data-kanban-status={status}
      style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRadius: '10px', background: C.bgSurface, border: `1px solid ${isDragOver ? cfg.color : C.border}`, borderTop: `3px solid ${cfg.color}`, transition: 'border-color 0.15s', overflow: 'hidden' }}
    >
      {/* Column header */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: cfg.color, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>{cfg.label}</span>
        <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: C.textGhost, background: C.bgBase, padding: '1px 6px', borderRadius: '999px', border: `1px solid ${C.border}` }}>{jobs.length}</span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px', maxHeight: '600px' }}>
        {jobs.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
            <div style={{ border: `1px dashed ${C.border}`, borderRadius: '8px', padding: '16px', textAlign: 'center', width: '100%' }}>
              <p style={{ fontSize: '11px', color: C.textGhost }}>No applications here</p>
            </div>
          </div>
        ) : (
          jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              isDragging={draggingJobId === job.id}
              onPointerDown={(e) => {
                if (e.button !== 0) return
                e.preventDefault()
                onPointerDown(e, job)
              }}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <button
        onClick={() => onAddClick(status)}
        style={{ margin: '8px 10px 10px', padding: '7px', background: 'transparent', border: `1px dashed ${C.border}`, borderRadius: '7px', color: C.textGhost, fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'border-color 0.12s, color 0.12s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textGhost }}
      >
        <Plus size={12} /> Add here
      </button>
    </div>
  )
}

function KanbanView({ jobs, draggingJobId, dragOverStatus, onPointerDown, onAddClick }) {
  const [search, setSearch] = useState('')
  const [sources, setSources] = useState([])
  const [sortBy, setSortBy] = useState('lastActivity')
  const searchRef = useRef(null)
  const searchTimer = useRef(null)

  const SORT_OPTIONS = [
    { value: 'lastActivity', label: 'Last Activity' },
    { value: 'dateApplied',  label: 'Date Applied'  },
    { value: 'company',      label: 'Company A–Z'   },
    { value: 'daysActive',   label: 'Days Active'   },
  ]

  const handleSearch = (val) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setSearch(val), 150)
  }

  const clearFilters = () => {
    setSearch('')
    setSources([])
    if (searchRef.current) searchRef.current.value = ''
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return jobs.filter(j => {
      if (q && !(j.company || '').toLowerCase().includes(q) && !(j.role || '').toLowerCase().includes(q)) return false
      if (sources.length && !sources.includes(j.source)) return false
      return true
    })
  }, [jobs, search, sources])

  const grouped = useMemo(() => {
    const map = {}
    STATUSES.forEach(s => { map[s] = [] })
    filtered.forEach(j => { if (map[j.status]) map[j.status].push(j) })
    STATUSES.forEach(s => {
      map[s].sort((a, b) => {
        if (sortBy === 'lastActivity') return new Date(b.lastActivity) - new Date(a.lastActivity)
        if (sortBy === 'dateApplied')  return new Date(b.dateApplied || 0) - new Date(a.dateApplied || 0)
        if (sortBy === 'company')      return a.company.toLowerCase().localeCompare(b.company.toLowerCase())
        if (sortBy === 'daysActive')   return (getDaysActive(b) ?? -1) - (getDaysActive(a) ?? -1)
        return 0
      })
    })
    return map
  }, [filtered, sortBy])

  const hasFilters = search || sources.length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="r-view-hdr">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '20px', color: C.textPrimary }}>Pipeline</h1>
          <button onClick={() => onAddClick('saved')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}`, borderRadius: '7px', fontSize: '13px', fontWeight: 500 }}>
            <Plus size={14} /> Add Job
          </button>
        </div>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '6px', flex: '1 1 180px', maxWidth: '280px' }}>
            <Search size={13} color={C.textGhost} style={{ flexShrink: 0 }} />
            <input
              ref={searchRef}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search company or role…"
              style={{ background: 'none', border: 'none', outline: 'none', color: C.textPrimary, fontSize: '13px', width: '100%' }}
            />
          </div>
          <MultiSelect label="Source" options={SOURCES} selected={sources} onChange={setSources} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '6px', flexShrink: 0 }}>
            <ArrowUpDown size={12} color={C.textGhost} style={{ flexShrink: 0 }} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: C.textSecondary, fontSize: '12px', cursor: 'pointer' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: C.bgSurface, color: C.textPrimary }}>{o.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: C.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>{filtered.length} / {jobs.length}</span>
              <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: C.textGhost, fontSize: '12px', padding: '4px 8px', textDecoration: 'underline', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Board */}
      <div className="r-view-board">
        {jobs.length === 0
          ? <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><EmptyState title="Pipeline is empty" subtitle="Start tracking your applications to fill the pipeline." action="+ Add Your First Job" onAction={() => onAddClick('saved')} /></div>
          : STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                jobs={grouped[status]}
                isDragOver={dragOverStatus === status}
                draggingJobId={draggingJobId}
                onPointerDown={onPointerDown}
                onAddClick={onAddClick}
              />
            ))
        }
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE VIEW
// ─────────────────────────────────────────────────────────────────────────────

function TableFilters({ filters, setFilters }) {
  const searchTimer = useRef(null)

  const setSearch = (val) => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setFilters(f => ({ ...f, search: val })), 150)
  }

  const clearAll = () => setFilters(f => ({ ...f, search: '', statuses: [], sources: [] }))
  const hasFilters = filters.search || filters.statuses.length || filters.sources.length

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '6px', flex: '1 1 200px', maxWidth: '300px' }}>
        <Search size={13} color={C.textGhost} style={{ flexShrink: 0 }} />
        <input
          defaultValue={filters.search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search company or role…"
          style={{ background: 'none', border: 'none', outline: 'none', color: C.textPrimary, fontSize: '13px', width: '100%' }}
        />
      </div>
      <MultiSelect label="Status" options={STATUSES.map(s => STATUS_CONFIG[s].label)} selected={filters.statuses.map(s => STATUS_CONFIG[s]?.label || s)} onChange={(labels) => setFilters(f => ({ ...f, statuses: labels.map(l => STATUSES.find(s => STATUS_CONFIG[s].label === l) || l) }))} />
      <MultiSelect label="Source" options={SOURCES} selected={filters.sources} onChange={(v) => setFilters(f => ({ ...f, sources: v }))} />
      {hasFilters && (
        <button onClick={clearAll} style={{ background: 'none', border: 'none', color: C.textGhost, fontSize: '12px', padding: '4px 8px', textDecoration: 'underline' }}>
          Clear filters
        </button>
      )}
    </div>
  )
}

function SortIcon({ column, filters }) {
  if (filters.sortColumn !== column) return <ArrowUpDown size={12} color={C.textGhost} />
  return filters.sortDir === 'asc' ? <ArrowUp size={12} color={C.cyan} /> : <ArrowDown size={12} color={C.cyan} />
}

function TableView({ jobs, filters, setFilters, onRowClick }) {
  const [showArchived, setShowArchived] = useState(false)
  const ARCHIVED = ['rejected', 'ghosted']
  const cols = [
    { key: 'company',      label: 'Company',      sortable: true,  w: '18%' },
    { key: 'role',         label: 'Role',         sortable: true,  w: '18%' },
    { key: 'source',       label: 'Source',       sortable: true,  w: '12%' },
    { key: 'status',       label: 'Status',       sortable: true,  w: '11%' },
    { key: 'dateApplied',  label: 'Applied',      sortable: true,  w: '10%' },
    { key: 'salary',       label: 'Salary',       sortable: false, w: '10%' },
    { key: 'daysActive',   label: 'Days',         sortable: true,  w: '6%'  },
    { key: 'jd',           label: 'JD',           sortable: false, w: '5%'  },
    { key: 'ai',           label: 'AI',           sortable: false, w: '5%'  },
  ]

  const toggleSort = (key) => {
    setFilters(f => ({
      ...f,
      sortColumn: key,
      sortDir: f.sortColumn === key && f.sortDir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const filtered = useMemo(() => {
    let list = [...jobs]
    if (!showArchived && !filters.statuses.length) list = list.filter(j => !ARCHIVED.includes(j.status))
    const q = filters.search.toLowerCase()
    if (q) list = list.filter(j => (j.company || '').toLowerCase().includes(q) || (j.role || '').toLowerCase().includes(q) || (j.notes || '').toLowerCase().includes(q))
    if (filters.statuses.length) list = list.filter(j => filters.statuses.includes(j.status))
    if (filters.sources.length) list = list.filter(j => filters.sources.includes(j.source))

    list.sort((a, b) => {
      let va, vb
      if (filters.sortColumn === 'daysActive') { va = getDaysActive(a) ?? -1; vb = getDaysActive(b) ?? -1 }
      else if (filters.sortColumn === 'salary') { va = a.salary?.min ?? 0; vb = b.salary?.min ?? 0 }
      else { va = (a[filters.sortColumn] || '').toString().toLowerCase(); vb = (b[filters.sortColumn] || '').toString().toLowerCase() }
      if (va < vb) return filters.sortDir === 'asc' ? -1 : 1
      if (va > vb) return filters.sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [jobs, filters])

  const thStyle = (sortable, key) => ({
    padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: C.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', cursor: sortable ? 'pointer' : 'default', userSelect: 'none', background: C.bgSurface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div className="r-view-hdr">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '20px', color: C.textPrimary }}>Applications</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setShowArchived(p => !p)}
              style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${showArchived ? C.amber : C.border}`, background: showArchived ? C.amberDim : 'transparent', color: showArchived ? C.amber : C.textGhost, cursor: 'pointer' }}>
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
            <span style={{ fontSize: '12px', color: C.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>
              {filtered.length} / {jobs.length}
            </span>
          </div>
        </div>
        <TableFilters filters={filters} setFilters={setFilters} />
      </div>

      {/* Table */}
      <div className="r-table-body">
        {jobs.length === 0 ? (
          <EmptyState title="No applications yet" subtitle="Add your first application to get started." />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: C.textSecondary, fontSize: '13px' }}>
            No applications match these filters. <button onClick={() => setFilters(f => ({ ...f, search: '', statuses: [], sources: [] }))} style={{ background: 'none', border: 'none', color: C.cyan, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
          </div>
        ) : (
          <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {cols.map(col => (
                  <th key={col.key} onClick={() => col.sortable && toggleSort(col.key)} style={{ ...thStyle(col.sortable, col.key), width: col.w }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {col.label}
                      {col.sortable && <SortIcon column={col.key} filters={filters} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, i) => {
                const days = getDaysActive(job)
                const salaryStr = job.salary?.min
                  ? `${job.salary.currency} ${job.salary.min.toLocaleString()}${job.salary.max ? `–${job.salary.max.toLocaleString()}` : '+'}`
                  : '—'
                return (
                  <tr
                    key={job.id}
                    onClick={() => onRowClick(job)}
                    style={{ background: i % 2 === 0 ? 'transparent' : `${C.bgSurface}66`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bgElevated}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : `${C.bgSurface}66`}
                  >
                    <td style={{ padding: '10px 14px', fontSize: '13px', color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.borderSubtle}` }}>{job.company}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.borderSubtle}` }}>{job.role}</td>
                    <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderSubtle}` }}><SourceBadge source={job.source} /></td>
                    <td style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderSubtle}` }}><StatusBadge status={job.status} /></td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: C.textSecondary, fontFamily: "'JetBrains Mono', monospace", borderBottom: `1px solid ${C.borderSubtle}` }}>{formatDate(job.dateApplied)}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', color: C.textSecondary, fontFamily: "'JetBrains Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.borderSubtle}` }}>{salaryStr}</td>
                    <td style={{ padding: '10px 14px', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace', color: days !== null && days > 14 ? C.amber : C.textGhost", borderBottom: `1px solid ${C.borderSubtle}`, color: days !== null && days > 14 ? C.amber : C.textGhost }}>{days !== null ? `${days}d` : '—'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', borderBottom: `1px solid ${C.borderSubtle}` }}>{job.jdText ? <Check size={13} color={C.emerald} /> : <span style={{ color: C.textGhost, fontSize: '11px' }}>—</span>}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', borderBottom: `1px solid ${C.borderSubtle}` }}>{job.aiAnalysis ? <Star size={13} color={C.amber} fill={C.amber} /> : <span style={{ color: C.textGhost, fontSize: '11px' }}>—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB MODAL
// ─────────────────────────────────────────────────────────────────────────────

const iStyle = (readOnly) => ({
  background: readOnly ? C.bgSurface : C.bgBase,
  border: `1px solid ${C.border}`,
  borderRadius: '6px',
  padding: '8px 12px',
  color: readOnly ? C.textSecondary : C.textPrimary,
  fontSize: '13px',
  width: '100%',
  outline: 'none',
})

function Fld({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '11px', color: C.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{required && <span style={{ color: C.red, marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: '11px', color: C.red }}>{error}</span>}
    </div>
  )
}

function JobModal({ job, initialMode, onClose, onSave, onDelete, showToast, aiLoading, setAiLoading, aiError, setAiError, onUpdateJob, resume = '' }) {
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ ...DEFAULT_JOB, ...job, salary: { ...DEFAULT_JOB.salary, ...job.salary }, contacts: job.contacts ? [...job.contacts] : [] })
  const [errors, setErrors] = useState({})
  const [dirty, setDirty] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [saving, setSaving] = useState(false)
  const ro = mode === 'view'

  const set = (field, value) => {
    setForm(p => {
      const next = { ...p, [field]: value }
      if (field === 'status' && ACTIVE_STATUSES.includes(value) && !p.dateApplied) {
        next.dateApplied = new Date().toISOString().slice(0, 10)
      }
      return next
    })
    setDirty(true)
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }))
  }

  const setSalary = (field, value) => {
    setForm(p => ({ ...p, salary: { ...p.salary, [field]: value } }))
    setDirty(true)
  }

  const handleClose = () => {
    if (dirty && mode !== 'view') { setShowWarning(true) } else { onClose() }
  }

  const handleSave = async () => {
    const errs = {}
    if (!form.company.trim()) errs.company = 'Required'
    if (!form.role.trim()) errs.role = 'Required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    await onSave({ ...form, contacts: form.contacts.filter(c => c.name.trim()) })
    setSaving(false)
  }

  const addContact = () => {
    setForm(p => ({ ...p, contacts: [...p.contacts, { ...DEFAULT_CONTACT, id: generateId('contact') }] }))
    setDirty(true)
  }

  const updateContact = (id, field, value) => {
    setForm(p => ({ ...p, contacts: p.contacts.map(c => c.id === id ? { ...c, [field]: value } : c) }))
    setDirty(true)
  }

  const removeContact = (id) => {
    setForm(p => ({ ...p, contacts: p.contacts.filter(c => c.id !== id) }))
    setDirty(true)
  }

  const showDateApplied = ACTIVE_STATUSES.includes(form.status)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, animation: 'fadeIn 0.15s ease-out' }}
      />
      {/* Panel */}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '780px', maxHeight: '90vh', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '12px', zIndex: 1001, display: 'flex', flexDirection: 'column', animation: 'slideUp 0.2s ease-out', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '16px', color: C.textPrimary }}>
              {mode === 'add' ? 'Add Application' : `${form.company || 'Application'}`}
            </h2>
            {mode !== 'add' && <p style={{ fontSize: '12px', color: C.textSecondary, marginTop: '2px' }}>{form.role}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {mode === 'view' && <button onClick={() => setMode('edit')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.textPrimary, fontSize: '12px' }}><Pencil size={12} /> Edit</button>}
            <button onClick={handleClose} style={{ background: 'none', border: 'none', color: C.textGhost, padding: '4px', display: 'flex' }}><X size={18} /></button>
          </div>
        </div>

        {/* Unsaved warning */}
        {showWarning && (
          <div style={{ padding: '10px 24px', background: C.amberDim, borderBottom: `1px solid ${C.amber}44`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '13px', color: C.amber }}>You have unsaved changes.</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.amber}`, borderRadius: '5px', padding: '4px 12px', color: C.amber, fontSize: '12px' }}>Discard</button>
              <button onClick={() => setShowWarning(false)} style={{ background: C.amber, border: 'none', borderRadius: '5px', padding: '4px 12px', color: C.bgBase, fontSize: '12px', fontWeight: 600 }}>Keep Editing</button>
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Fld label="Company" required error={errors.company}>
                <input value={form.company} onChange={e => set('company', e.target.value)} readOnly={ro} placeholder="e.g. Amazon Web Services" style={{ ...iStyle(ro) }} />
              </Fld>
              <Fld label="Role" required error={errors.role}>
                <input value={form.role} onChange={e => set('role', e.target.value)} readOnly={ro} placeholder="e.g. Cloud Engineer" style={{ ...iStyle(ro) }} />
              </Fld>
              <Fld label="Source">
                {ro
                  ? <input value={form.source} readOnly style={{ ...iStyle(true) }} />
                  : <select value={form.source} onChange={e => set('source', e.target.value)} style={{ ...iStyle(false), cursor: 'pointer' }}>
                      {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                }
              </Fld>
              <Fld label="Status">
                {ro
                  ? <div style={{ paddingTop: '4px' }}><StatusBadge status={form.status} /></div>
                  : <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...iStyle(false), cursor: 'pointer' }}>
                      {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                    </select>
                }
              </Fld>
              {showDateApplied && (
                <Fld label="Date Applied">
                  <input type="date" value={form.dateApplied || ''} onChange={e => set('dateApplied', e.target.value)} readOnly={ro} style={{ ...iStyle(ro), colorScheme: 'dark' }} />
                </Fld>
              )}
              <Fld label="Job URL">
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={form.url} onChange={e => set('url', e.target.value)} readOnly={ro} placeholder="https://…" style={{ ...iStyle(ro) }} />
                  {form.url && <a href={form.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.textSecondary, flexShrink: 0 }}><ExternalLink size={13} /></a>}
                </div>
              </Fld>
            </div>

            {/* Right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Fld label="Salary Min">
                  <input type="number" value={form.salary.min || ''} onChange={e => setSalary('min', e.target.value ? Number(e.target.value) : null)} readOnly={ro} placeholder="0" style={{ ...iStyle(ro) }} />
                </Fld>
                <Fld label="Salary Max">
                  <input type="number" value={form.salary.max || ''} onChange={e => setSalary('max', e.target.value ? Number(e.target.value) : null)} readOnly={ro} placeholder="0" style={{ ...iStyle(ro) }} />
                </Fld>
              </div>
              <Fld label="Currency">
                {ro
                  ? <input value={form.salary.currency} readOnly style={{ ...iStyle(true) }} />
                  : <div style={{ display: 'flex', gap: '8px' }}>
                      {['PHP', 'USD'].map(cur => (
                        <button key={cur} onClick={() => setSalary('currency', cur)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${form.salary.currency === cur ? C.cyan : C.border}`, background: form.salary.currency === cur ? C.cyanDim : 'transparent', color: form.salary.currency === cur ? C.cyan : C.textSecondary, fontSize: '13px', fontWeight: 500 }}>
                          {cur}
                        </button>
                      ))}
                    </div>
                }
              </Fld>
              <Fld label="Tags">
                <TagInput tags={form.tags} onChange={v => { setForm(p => ({ ...p, tags: v })); setDirty(true) }} readOnly={ro} />
              </Fld>
              <Fld label="Job Description">
                <textarea
                  value={form.jdText}
                  onChange={e => set('jdText', e.target.value)}
                  readOnly={ro}
                  placeholder="Paste the job description here for AI tools…"
                  rows={6}
                  style={{ ...iStyle(ro), resize: 'vertical', lineHeight: 1.5 }}
                />
              </Fld>
            </div>
          </div>

          {/* Notes — full width */}
          <Fld label="Notes">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} readOnly={ro} placeholder="Notes, links, follow-up reminders…" rows={3} style={{ ...iStyle(ro), resize: 'vertical', lineHeight: 1.5, marginBottom: '0' }} />
          </Fld>

          {/* Contacts */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.borderSubtle}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: C.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contacts</label>
              {!ro && <button onClick={addContact} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', color: C.cyan, fontSize: '12px', padding: '4px 0' }}><Plus size={12} /> Add Contact</button>}
            </div>
            {form.contacts.length === 0
              ? <p style={{ fontSize: '12px', color: C.textGhost }}>No contacts added.</p>
              : form.contacts.map(c => (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', padding: '10px', background: C.bgBase, borderRadius: '8px', marginBottom: '8px', border: `1px solid ${C.borderSubtle}`, position: 'relative' }}>
                    {['name', 'role', 'email', 'linkedin'].map(f => (
                      <input key={f} value={c[f]} onChange={e => updateContact(c.id, f, e.target.value)} readOnly={ro} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} style={{ ...iStyle(ro), fontSize: '12px' }} />
                    ))}
                    {!ro && <button onClick={() => removeContact(c.id)} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: C.textGhost, padding: '2px', display: 'flex' }}><X size={12} /></button>}
                  </div>
                ))
            }
          </div>

          {mode !== 'add' && showToast && (
            <AIResultsPanel
              job={form}
              onUpdateJob={(changes) => { onUpdateJob(changes); setForm(p => ({ ...p, ...changes })) }}
              showToast={showToast}
              aiLoading={aiLoading}
              setAiLoading={setAiLoading}
              aiError={aiError}
              setAiError={setAiError}
              resume={resume}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            {mode === 'edit' && initialMode !== 'add' && (
              <ConfirmButton label="Delete Application" confirmLabel="Confirm Delete" onConfirm={onDelete} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleClose} style={{ padding: '8px 20px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.textSecondary, fontSize: '13px' }}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', background: C.cyan, border: 'none', borderRadius: '6px', color: C.bgBase, fontSize: '13px', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : mode === 'add' ? 'Add Application' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD CHARTS
// ─────────────────────────────────────────────────────────────────────────────

function StatusDonutChart({ jobs, onStatusClick }) {
  const data = useMemo(() => STATUSES
    .map(s => ({ name: STATUS_CONFIG[s].label, value: jobs.filter(j => j.status === s).length, status: s, color: STATUS_CONFIG[s].color }))
    .filter(d => d.value > 0), [jobs])

  const total = data.reduce((s, d) => s + d.value, 0)

  const tooltipStyle = { background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', color: C.textPrimary, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }

  if (!data.length) return <p style={{ color: C.textGhost, fontSize: '13px', textAlign: 'center', padding: '32px 0' }}>No data yet</p>

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <div style={{ flexShrink: 0 }}>
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={42} outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              onClick={(entry) => onStatusClick(entry.status)}
              cursor="pointer"
              strokeWidth={0}
            >
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => [`${v} (${Math.round(v / total * 100)}%)`, name]}
              itemStyle={{ color: C.textPrimary }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px', minWidth: 0 }}>
        {data.map(d => (
          <div
            key={d.status}
            onClick={() => onStatusClick(d.status)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 6px', borderRadius: '5px', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.bgElevated}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: C.textSecondary, flex: 1 }}>{d.name}</span>
            <span style={{ fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", color: C.textPrimary, fontWeight: 500 }}>{d.value}</span>
            <span style={{ fontSize: '11px', color: C.textGhost, minWidth: '28px', textAlign: 'right' }}>{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WeeklyBarChart({ data, weeklyGoal }) {
  const tooltipStyle = { background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', color: C.textPrimary, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
        <XAxis dataKey="label" tick={{ fill: C.textGhost, fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.textGhost, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: `${C.bgElevated}` }}
          formatter={(v) => [v, 'Applications']}
          itemStyle={{ color: C.cyan }}
        />
        <ReferenceLine y={weeklyGoal} stroke={C.cyan} strokeDasharray="5 4" strokeWidth={1.5} label={{ value: `Goal: ${weeklyGoal}`, position: 'insideTopRight', fill: C.cyan, fontSize: 10 }} />
        <Bar dataKey="count" fill={C.cyan} fillOpacity={0.65} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function ActivityHeatmap({ jobs }) {
  const [tooltip, setTooltip] = useState(null)

  const counts = useMemo(() => {
    const map = {}
    jobs.forEach(j => { if (j.dateApplied) map[j.dateApplied] = (map[j.dateApplied] || 0) + 1 })
    return map
  }, [jobs])

  const weeks = useMemo(() => {
    const toLocalKey = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dow = today.getDay() || 7 // Mon=1 … Sun=7
    // Start on a Monday 26 full weeks back
    const start = new Date(today)
    start.setDate(today.getDate() - (dow - 1) - 25 * 7)

    const result = []
    const cur = new Date(start)
    while (cur <= today) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const day = new Date(cur); day.setDate(cur.getDate() + d)
        if (day > today) { week.push(null); continue }
        const key = toLocalKey(day)
        week.push({ key, count: counts[key] || 0, day: new Date(day) })
      }
      result.push(week)
      cur.setDate(cur.getDate() + 7)
    }
    return result
  }, [counts])

  const getColor = (count) => {
    if (!count)    return C.bgElevated
    if (count === 1) return C.emeraldDim
    if (count === 2) return `${C.emerald}55`
    if (count === 3) return `${C.emerald}99`
    return C.emerald
  }

  const monthLabels = useMemo(() => {
    const labels = []
    weeks.forEach((week, i) => {
      const first = week.find(d => d)
      if (!first) return
      const d = first.day
      if (i === 0 || d.getDate() <= 7) {
        labels.push({ i, label: MONTHS[d.getMonth()] })
      }
    })
    return labels
  }, [weeks])

  const totalApps = useMemo(() => Object.values(counts).reduce((s, v) => s + v, 0), [counts])
  const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']
  const CELL = 12, GAP = 3, DAY_COL = 30

  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ fontSize: '11px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Activity</p>
          {totalApps > 0 && <span style={{ fontSize: '11px', color: C.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>{totalApps} in 6 months</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '10px', color: C.textGhost }}>Less</span>
          {[0,1,2,3,4].map(l => <div key={l} style={{ width: CELL, height: CELL, borderRadius: 2, background: getColor(l) }} />)}
          <span style={{ fontSize: '10px', color: C.textGhost }}>More</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: '2px' }}>
        <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
          {/* Month labels — pixel-positioned relative to each week column */}
          <div style={{ position: 'relative', height: 16, marginLeft: DAY_COL, marginBottom: 3, width: weeks.length * (CELL + GAP) }}>
            {monthLabels.map(({ i, label }) => (
              <span key={i} style={{ position: 'absolute', left: i * (CELL + GAP), fontSize: 10, color: C.textGhost, whiteSpace: 'nowrap' }}>{label}</span>
            ))}
          </div>

          <div style={{ display: 'flex' }}>
            {/* Day labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, width: DAY_COL, flexShrink: 0, paddingRight: 6 }}>
              {DAYS.map((d, i) => (
                <div key={i} style={{ height: CELL, fontSize: 9, color: C.textGhost, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>{d}</div>
              ))}
            </div>

            {/* Week columns — fixed 12×12 squares, no stretching */}
            <div style={{ display: 'flex', gap: GAP }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                  {week.map((day, di) => (
                    <div
                      key={di}
                      style={{ width: CELL, height: CELL, borderRadius: 2, flexShrink: 0, background: day ? getColor(day.count) : 'transparent', transition: 'opacity 0.1s' }}
                      onMouseEnter={(e) => { if (day) setTooltip({ key: day.key, count: day.count, x: e.clientX, y: e.clientY }) }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 10, top: tooltip.y - 36, background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: 6, padding: '5px 10px', fontSize: 11, color: C.textPrimary, pointerEvents: 'none', zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          <span style={{ color: C.emerald, fontWeight: 600 }}>{tooltip.count} application{tooltip.count !== 1 ? 's' : ''}</span>
          <span style={{ color: C.textGhost }}> · {tooltip.key}</span>
        </div>
      )}
    </div>
  )
}

function SourceBreakdownChart({ jobs }) {
  const data = useMemo(() => {
    return SOURCES.map(src => {
      const total = jobs.filter(j => j.source === src).length
      const responded = jobs.filter(j => j.source === src && ['screening', 'interview', 'offer'].includes(j.status)).length
      return { source: src, total, responded }
    }).filter(d => d.total > 0).sort((a, b) => b.total - a.total)
  }, [jobs])

  if (!data.length) return <p style={{ fontSize: '12px', color: C.textGhost }}>No data yet.</p>

  const max = Math.max(...data.map(d => d.total))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map(d => (
        <div key={d.source}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', color: C.textSecondary }}>{d.source}</span>
            <span style={{ fontSize: '11px', color: C.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>
              {d.responded}/{d.total}
            </span>
          </div>
          <div style={{ height: '6px', borderRadius: '3px', background: C.bgElevated, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ width: `${(d.responded / max) * 100}%`, background: C.emerald, borderRadius: '3px', transition: 'width 0.4s ease' }} />
              <div style={{ width: `${((d.total - d.responded) / max) * 100}%`, background: C.cyan + '55', borderRadius: '3px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
        <span style={{ fontSize: '10px', color: C.emerald }}>■ Responded</span>
        <span style={{ fontSize: '10px', color: C.cyan + 'AA' }}>■ Applied</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD LISTS
// ─────────────────────────────────────────────────────────────────────────────

function RecentActivityList({ jobs, onUpdateJob }) {
  const recent = useMemo(() =>
    [...jobs].sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)).slice(0, 5),
    [jobs]
  )
  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '18px 20px' }}>
      <p style={{ fontSize: '11px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '14px' }}>Recent Activity</p>
      {recent.length === 0
        ? <p style={{ fontSize: '13px', color: C.textGhost }}>No activity yet.</p>
        : recent.map(j => (
          <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${C.borderSubtle}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', color: C.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.company}</p>
              <p style={{ fontSize: '11px', color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>{j.role}</p>
            </div>
            <select
              value={j.status}
              onChange={e => onUpdateJob && onUpdateJob(j.id, { status: e.target.value })}
              onClick={e => e.stopPropagation()}
              style={{ background: STATUS_CONFIG[j.status]?.dim || C.bgElevated, border: `1px solid ${STATUS_CONFIG[j.status]?.color || C.border}33`, borderRadius: '999px', color: STATUS_CONFIG[j.status]?.color || C.textSecondary, fontSize: '11px', fontWeight: 500, padding: '2px 6px', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
            >
              {STATUSES.map(s => <option key={s} value={s} style={{ background: C.bgSurface, color: C.textPrimary }}>{STATUS_CONFIG[s].label}</option>)}
            </select>
            <span style={{ fontSize: '11px', color: C.textGhost, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, minWidth: '52px', textAlign: 'right' }}>{timeAgo(j.lastActivity)}</span>
          </div>
        ))
      }
    </div>
  )
}

function FollowUpList({ jobs, onMarkFollowedUp }) {
  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.amber}`, borderRadius: '10px', padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Bell size={13} color={C.amber} />
        <p style={{ fontSize: '11px', color: C.amber, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Follow-up Needed</p>
      </div>
      {jobs.map(j => {
        const days = daysAgo(j.lastActivity)
        const urgent = days > 14
        return (
          <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${C.borderSubtle}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', color: C.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.company}</p>
              <p style={{ fontSize: '11px', color: C.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.role}</p>
            </div>
            <span style={{ fontSize: '11px', color: urgent ? C.red : C.amber, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0, fontWeight: 600 }}>{days}d ago</span>
            <StatusBadge status={j.status} />
            <button
              onClick={() => onMarkFollowedUp(j.id, { lastActivity: new Date().toISOString() })}
              style={{ background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '4px 10px', color: C.textSecondary, fontSize: '11px', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              Mark Done
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD VIEW (full — replaces placeholder)
// ─────────────────────────────────────────────────────────────────────────────

function DashboardView({ jobs, settings, setView, setTableFilters, updateJob, onAddClick, onEmailImport }) {
  const [showReport, setShowReport] = useState(false)
  const weeklyGoal = settings.weeklyGoal || 15

  const thisWeekApps = useMemo(() => {
    const now = new Date()
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    monday.setHours(0, 0, 0, 0)
    return jobs.filter(j => j.dateApplied && new Date(j.dateApplied) >= monday).length
  }, [jobs])

  const responseRate = useMemo(() => {
    const applied = jobs.filter(j => ACTIVE_STATUSES.includes(j.status)).length
    if (!applied) return null
    const responded = jobs.filter(j => ['screening', 'interview', 'offer'].includes(j.status)).length
    return Math.round(responded / applied * 100)
  }, [jobs])

  const activePipeline = useMemo(() =>
    jobs.filter(j => ['screening', 'interview', 'offer'].includes(j.status)).length, [jobs])

  const weeklyHistory = useMemo(() => getWeeklyHistory(jobs), [jobs])

  const streak = useMemo(() => {
    const appliedDays = new Set(jobs.filter(j => j.dateApplied).map(j => j.dateApplied.slice(0, 10)))
    let count = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if (appliedDays.has(key)) count++
      else if (i > 0) break
    }
    return count
  }, [jobs])

  const avgResponseDays = useMemo(() => {
    const pairs = jobs.filter(j => j.dateApplied && ['screening', 'interview', 'offer'].includes(j.status) && j.lastActivity)
    if (!pairs.length) return null
    const avg = pairs.reduce((sum, j) => sum + Math.floor((new Date(j.lastActivity) - new Date(j.dateApplied)) / 86400000), 0) / pairs.length
    return Math.round(avg)
  }, [jobs])

  const followUps = useMemo(() =>
    jobs
      .filter(j => ['applied', 'screening'].includes(j.status) && daysAgo(j.lastActivity) > 7)
      .sort((a, b) => daysAgo(b.lastActivity) - daysAgo(a.lastActivity)),
    [jobs]
  )

  const handleStatusClick = (status) => {
    setTableFilters(f => ({ ...f, statuses: [status], search: '', sources: [] }))
    setView('table')
  }

  const goalColor = thisWeekApps >= weeklyGoal ? C.emerald : thisWeekApps >= weeklyGoal * 0.5 ? C.amber : C.red

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify({ jobs, settings }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `job-hunt-export-${date}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const iconBtn = { width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: C.textSecondary, border: `1px solid ${C.border}`, borderRadius: '7px', cursor: 'pointer', flexShrink: 0 }
  const sectionLabel = (text) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, flexShrink: 0 }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: C.border }} />
    </div>
  )

  return (
    <div className="r-dash">
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          {settings.name && (
            <p style={{ fontSize: '12px', color: C.textGhost, marginBottom: '3px' }}>
              Good {greeting}, {settings.name.split(' ')[0]}
            </p>
          )}
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '22px', color: C.textPrimary }}>Command Center</h1>
          <p style={{ fontSize: '11px', color: goalColor, marginTop: '3px', fontFamily: "'JetBrains Mono', monospace" }}>
            {thisWeekApps} / {weeklyGoal} this week{thisWeekApps >= weeklyGoal ? ' — goal reached' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button title="Import from Email / Paste" onClick={onEmailImport} style={iconBtn}><ArrowUp size={14} /></button>
          <button title="Weekly Report" onClick={() => setShowReport(true)} style={iconBtn}><FileText size={14} /></button>
          <button title="Export JSON" onClick={handleExport} style={iconBtn}><ArrowDown size={14} /></button>
          <button onClick={() => onAddClick('saved')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: C.cyanDim, color: C.cyan, border: `1px solid ${C.cyan}33`, borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginLeft: '4px' }}>
            <Plus size={14} /> Add Job
          </button>
        </div>
      </div>

      {showReport && <WeeklyReportModal jobs={jobs} settings={settings} onClose={() => setShowReport(false)} />}

      {jobs.length === 0 ? (
        <EmptyState
          title="No applications yet"
          subtitle="Your command center is ready. Start tracking your first opportunity."
          action="+ Add Your First Application"
          onAction={() => onAddClick('saved')}
        />
      ) : (
        <>
          {/* ── Primary Metrics ── */}
          <div className="r-grid3" style={{ marginBottom: '14px' }}>
            <MetricCard label="Total Applications" value={jobs.length} />
            <MetricCard
              label="Applied This Week"
              value={thisWeekApps}
              sub={`Goal: ${weeklyGoal} / week`}
              color={goalColor}
              ring={<GoalRing value={thisWeekApps} max={weeklyGoal} size={56} strokeWidth={6} />}
            />
            <MetricCard label="Active Pipeline" value={activePipeline} color={C.cyan} sub="screening · interview · offer" />
          </div>

          {/* ── Secondary Stats Strip ── */}
          <div className="r-stats" style={{ '--border-color': C.border, background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px 20px', marginBottom: '28px', boxShadow: C.shadow }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '6px' }}>Response Rate</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', fontWeight: 700, color: responseRate !== null ? (responseRate >= 20 ? C.emerald : responseRate >= 10 ? C.amber : C.red) : C.textGhost, lineHeight: 1, marginBottom: '4px' }}>{responseRate !== null ? `${responseRate}%` : '—'}</p>
              <p style={{ fontSize: '11px', color: C.textSecondary }}>screening + interview + offer</p>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '6px' }}>Application Streak</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', fontWeight: 700, color: streak >= 7 ? C.emerald : streak >= 3 ? C.amber : C.textSecondary, lineHeight: 1, marginBottom: '4px' }}>{streak > 0 ? `${streak}d` : '0d'}</p>
              <p style={{ fontSize: '11px', color: C.textSecondary }}>{streak >= 7 ? 'On fire! Keep it up.' : streak > 0 ? 'Consecutive days applied' : 'Apply today to start'}</p>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '6px' }}>Avg Response Time</p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', fontWeight: 700, color: avgResponseDays !== null ? (avgResponseDays <= 7 ? C.emerald : avgResponseDays <= 14 ? C.amber : C.red) : C.textGhost, lineHeight: 1, marginBottom: '4px' }}>{avgResponseDays !== null ? `${avgResponseDays}d` : '—'}</p>
              <p style={{ fontSize: '11px', color: C.textSecondary }}>applied → first contact</p>
            </div>
          </div>

          {/* ── Analytics ── */}
          {sectionLabel('Analytics')}
          <div className="r-grid3-mb">
            <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '18px 20px', boxShadow: C.shadow }}>
              <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '4px' }}>Status Breakdown</p>
              <p style={{ fontSize: '11px', color: C.textGhost, marginBottom: '12px' }}>Click segment to filter</p>
              <StatusDonutChart jobs={jobs} onStatusClick={handleStatusClick} />
            </div>
            <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '18px 20px', boxShadow: C.shadow }}>
              <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginBottom: '14px' }}>Source Breakdown</p>
              <SourceBreakdownChart jobs={jobs} />
            </div>
            <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '18px 20px', boxShadow: C.shadow }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Weekly Activity</p>
                <span style={{ fontSize: '11px', color: C.cyan, fontFamily: "'JetBrains Mono', monospace" }}>goal: {weeklyGoal}/wk</span>
              </div>
              <WeeklyBarChart data={weeklyHistory} weeklyGoal={weeklyGoal} />
            </div>
          </div>

          {/* ── Activity Heatmap ── */}
          <div style={{ marginBottom: '28px' }}>
            <ActivityHeatmap jobs={jobs} />
          </div>

          {/* ── Pipeline ── */}
          {sectionLabel('Pipeline')}
          <div className="r-pipeline" style={{ gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <RecentActivityList jobs={jobs} onUpdateJob={updateJob} />
            {followUps.length > 0 && <FollowUpList jobs={followUps} onMarkFollowedUp={updateJob} />}
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PANELS
// ─────────────────────────────────────────────────────────────────────────────

function JDAnalyzerPanel({ initialJdText = '', initialResult = null, showToast, aiLoading, setAiLoading, aiError, setAiError, onSave, resume = '', embeddedJdText }) {
  const [jdText, setJdText] = useState(initialJdText)
  const [result, setResult] = useState(initialResult)
  const loading = aiLoading['jd-analyzer']
  const isEmbedded = embeddedJdText !== undefined
  const effectiveJd = isEmbedded ? embeddedJdText : jdText

  const analyze = async () => {
    if (!effectiveJd.trim()) { showToast('error', isEmbedded ? 'Add a job description in the form above first.' : 'Paste a job description first.'); return }
    const candidateCtx = resume && resume.trim() ? resume.trim() : USER_BACKGROUND_CONTEXT
    const prompt = `You are a career advisor AI. Analyze the following job description against a candidate's background and return a fit assessment.\n\nCANDIDATE BACKGROUND:\n${candidateCtx}\n\nJOB DESCRIPTION:\n${effectiveJd}\n\nAnalyze the fit between the candidate and this role. Return ONLY a valid JSON object with NO markdown formatting, NO code fences, NO preamble, NO trailing text. The JSON must match this exact structure:\n\n{\n  "fit_score": <integer 0-100, overall fit percentage>,\n  "matched_skills": [<array of strings: skills/technologies in the JD that the candidate has>],\n  "gaps": [<array of strings: skills/technologies in the JD that the candidate is missing or weak in>],\n  "keywords": [<array of strings: 8-12 resume optimization keywords extracted from the JD, prioritized by frequency and importance>]\n}\n\nScoring guide:\n- 80-100: Strong match, candidate has most required and preferred qualifications\n- 60-79: Good match, candidate has core requirements but some gaps\n- 40-59: Partial match, significant gaps but transferable skills present\n- 0-39: Weak match, major skill misalignment\n\nBe specific in matched_skills and gaps — use the exact technology names as written in the JD. Limit each array to a maximum of 10 items.`
    const r = await callAI(prompt, 'jd-analyzer', 800, setAiLoading, setAiError, showToast)
    if (r) setResult({ ...r, generatedAt: new Date().toISOString() })
  }

  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.cyan}`, borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '15px', color: C.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Search size={15} style={{ color: C.cyan }} /> JD Fit Analyzer
      </h3>
      {!isEmbedded && (
        <textarea value={jdText} onChange={e => setJdText(e.target.value)} disabled={loading}
          placeholder="Paste the job description here…" rows={6}
          style={{ width: '100%', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '10px 12px', color: C.textPrimary, fontSize: '13px', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box', opacity: loading ? 0.6 : 1 }} />
      )}
      {isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: C.bgBase, border: `1px solid ${effectiveJd.trim() ? C.border : C.borderSubtle}`, borderRadius: '7px', marginBottom: '10px' }}>
          <FileText size={13} style={{ color: effectiveJd.trim() ? C.cyan : C.textGhost, flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: effectiveJd.trim() ? C.textSecondary : C.textGhost, margin: 0 }}>
            {effectiveJd.trim() ? 'Using job description from this application' : 'Add a job description in the "Job Description" field above to analyze fit'}
          </p>
        </div>
      )}
      <button onClick={analyze} disabled={loading || (isEmbedded && !effectiveJd.trim())}
        style={{ marginTop: isEmbedded ? '0' : '10px', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: (loading || (isEmbedded && !effectiveJd.trim())) ? C.bgElevated : C.cyanDim, border: `1px solid ${(loading || (isEmbedded && !effectiveJd.trim())) ? C.border : C.cyan}`, borderRadius: '7px', color: (loading || (isEmbedded && !effectiveJd.trim())) ? C.textSecondary : C.cyan, fontSize: '13px', fontWeight: 500, cursor: (loading || (isEmbedded && !effectiveJd.trim())) ? 'not-allowed' : 'pointer' }}>
        {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Search size={13} /> Analyze Fit</>}
      </button>
      {loading && <AIShimmer />}
      {result && !loading && (
        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '16px' }}>
            <FitScoreRing score={result.fit_score} />
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '5px' }}>Matched Skills</p>
                <SkillPillRow skills={result.matched_skills} color={C.emerald} />
              </div>
              <div>
                <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '5px' }}>Skill Gaps</p>
                <SkillPillRow skills={result.gaps} color={C.red} />
              </div>
              <div>
                <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '5px' }}>Resume Keywords</p>
                <SkillPillRow skills={result.keywords} color={C.cyan} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: '11px', color: C.textGhost }}>Generated {timeAgo(result.generatedAt)}</p>
            {onSave && <button onClick={() => onSave(result)} style={{ padding: '6px 14px', background: C.emeraldDim, border: `1px solid ${C.emerald}`, borderRadius: '6px', color: C.emerald, fontSize: '12px', fontWeight: 500 }}>Save to Application</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function CoverLetterPanel({ initialCompany = '', initialRole = '', initialJdText = '', initialResult = null, showToast, aiLoading, setAiLoading, aiError, setAiError, onSave, resume = '', embeddedJdText, embeddedCompany, embeddedRole }) {
  const [company, setCompany] = useState(initialCompany)
  const [role, setRole] = useState(initialRole)
  const [jdText, setJdText] = useState(initialJdText)
  const [result, setResult] = useState(initialResult)
  const [letterText, setLetterText] = useState(initialResult?.cover_letter?.replace(/\\n\\n/g, '\n\n') || '')
  const [errs, setErrs] = useState({})
  const loading = aiLoading['cover-letter']
  const isEmbedded = embeddedJdText !== undefined
  const effectiveCompany = isEmbedded ? (embeddedCompany ?? '') : company
  const effectiveRole = isEmbedded ? (embeddedRole ?? '') : role
  const effectiveJd = isEmbedded ? embeddedJdText : jdText

  const generate = async () => {
    const e = {}
    if (!effectiveCompany.trim()) e.company = 'Required'
    if (!effectiveRole.trim()) e.role = 'Required'
    setErrs(e)
    if (Object.keys(e).length) return
    const jd = effectiveJd.length > 3500 ? effectiveJd.slice(0, 3500) : effectiveJd
    const candidateCtx = resume && resume.trim() ? resume.trim() : USER_BACKGROUND_CONTEXT
    const prompt = `You are a professional cover letter writer specializing in tech roles. Write a tailored cover letter for the following application.\n\nCANDIDATE BACKGROUND:\n${candidateCtx}\n\nAPPLICATION DETAILS:\n- Company: ${effectiveCompany}\n- Role: ${effectiveRole}\n- Job Description: ${jd}\n\nWrite a professional cover letter that:\n1. Opens with a specific hook referencing the company or role (not a generic opener)\n2. Highlights 2-3 most relevant AWS/DevOps skills that directly match requirements in the JD\n3. References concrete examples from the candidate's background (use plausible specifics based on the background provided — cloud infrastructure projects, containerization work, IaC implementations)\n4. Keeps a confident, professional tone without being arrogant\n5. Is 3-4 paragraphs, approximately 250-320 words total\n6. Ends with a specific call to action\n\nReturn ONLY a valid JSON object with NO markdown, NO code fences, NO preamble:\n\n{\n  "cover_letter": "<the complete cover letter text as a single string, with paragraph breaks as \\\\n\\\\n>",\n  "key_points": [<array of 3 strings: the 3 main selling points emphasized in this letter>]\n}`
    const r = await callAI(prompt, 'cover-letter', 1200, setAiLoading, setAiError, showToast)
    if (r) {
      setResult({ ...r, generatedAt: new Date().toISOString() })
      setLetterText(r.cover_letter.replace(/\\n\\n/g, '\n\n'))
    }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(letterText); showToast('success', 'Copied to clipboard.') }
    catch { showToast('info', 'Select the text and copy manually.') }
  }

  const wordCount = letterText.trim() ? letterText.trim().split(/\s+/).length : 0
  const fieldStyle = (f) => ({ width: '100%', background: C.bgBase, border: `1px solid ${errs[f] ? C.red : C.border}`, borderRadius: '7px', padding: '9px 12px', color: C.textPrimary, fontSize: '13px', boxSizing: 'border-box' })

  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.violet}`, borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '15px', color: C.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={15} style={{ color: C.violet }} /> Cover Letter Generator
      </h3>
      {!isEmbedded ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <input value={company} onChange={e => { setCompany(e.target.value); setErrs(p => ({ ...p, company: null })) }} disabled={loading} placeholder="Company name *" style={fieldStyle('company')} />
            {errs.company && <p style={{ fontSize: '11px', color: C.red, marginTop: '3px' }}>{errs.company}</p>}
          </div>
          <div>
            <input value={role} onChange={e => { setRole(e.target.value); setErrs(p => ({ ...p, role: null })) }} disabled={loading} placeholder="Role title *" style={fieldStyle('role')} />
            {errs.role && <p style={{ fontSize: '11px', color: C.red, marginTop: '3px' }}>{errs.role}</p>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 12px', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', color: effectiveCompany ? C.textPrimary : C.textGhost, fontWeight: effectiveCompany ? 500 : 400 }}>{effectiveCompany || 'No company'}</span>
          <span style={{ padding: '6px 12px', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '6px', fontSize: '12px', color: effectiveRole ? C.textSecondary : C.textGhost }}>{effectiveRole || 'No role'}</span>
          {errs.company && <p style={{ fontSize: '11px', color: C.red, width: '100%', margin: '2px 0 0' }}>Company name is required — fill in the form above</p>}
          {errs.role && <p style={{ fontSize: '11px', color: C.red, width: '100%', margin: '2px 0 0' }}>Role is required — fill in the form above</p>}
        </div>
      )}
      {!isEmbedded && (
        <textarea value={jdText} onChange={e => setJdText(e.target.value)} disabled={loading}
          placeholder="Job description (optional but recommended)…" rows={4}
          style={{ width: '100%', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '10px 12px', color: C.textPrimary, fontSize: '13px', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box', marginBottom: '10px', opacity: loading ? 0.6 : 1 }} />
      )}
      {isEmbedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: C.bgBase, border: `1px solid ${effectiveJd.trim() ? C.border : C.borderSubtle}`, borderRadius: '7px', marginBottom: '10px' }}>
          <FileText size={13} style={{ color: effectiveJd.trim() ? C.violet : C.textGhost, flexShrink: 0 }} />
          <p style={{ fontSize: '12px', color: effectiveJd.trim() ? C.textSecondary : C.textGhost, margin: 0 }}>
            {effectiveJd.trim() ? 'Using job description from this application' : 'Add a job description above for a more tailored letter (optional)'}
          </p>
        </div>
      )}
      <button onClick={generate} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: loading ? C.bgElevated : C.violetDim, border: `1px solid ${loading ? C.border : C.violet}`, borderRadius: '7px', color: loading ? C.textSecondary : C.violet, fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><FileText size={13} /> Generate Cover Letter</>}
      </button>
      {loading && <AIShimmer />}
      {letterText && !loading && (
        <div style={{ marginTop: '16px' }}>
          {result?.key_points?.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '5px' }}>Key Points</p>
              <SkillPillRow skills={result.key_points} color={C.violet} />
            </div>
          )}
          <textarea value={letterText} onChange={e => setLetterText(e.target.value)} rows={10}
            style={{ width: '100%', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '12px 14px', color: C.textPrimary, fontSize: '13px', lineHeight: 1.65, resize: 'vertical', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: C.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>
              {wordCount} words{result?.generatedAt ? ` · ${timeAgo(result.generatedAt)}` : ''}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={copy} style={{ padding: '6px 14px', background: C.bgElevated, border: `1px solid ${C.border}`, borderRadius: '6px', color: C.textSecondary, fontSize: '12px' }}>Copy</button>
              {onSave && <button onClick={() => onSave(letterText)} style={{ padding: '6px 14px', background: C.emeraldDim, border: `1px solid ${C.emerald}`, borderRadius: '6px', color: C.emerald, fontSize: '12px', fontWeight: 500 }}>Save to Application</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InterviewPrepPanel({ initialJdText = '', initialResult = null, showToast, aiLoading, setAiLoading, aiError, setAiError, onSave, resume = '', embeddedJdText }) {
  const [jdText, setJdText] = useState(initialJdText)
  const [roleType, setRoleType] = useState('Hybrid')
  const [result, setResult] = useState(initialResult)
  const loading = aiLoading['interview-prep']
  const isEmbedded = embeddedJdText !== undefined
  const effectiveJd = isEmbedded ? embeddedJdText : jdText

  const generate = async () => {
    if (!effectiveJd.trim()) { showToast('error', isEmbedded ? 'Add a job description in the form above first.' : 'Paste a job description first.'); return }
    const counts = { 'Technical': '6 technical + 3 behavioral', 'Hybrid': '4 technical + 4 behavioral', 'Behavioral-Heavy': '2 technical + 6 behavioral' }
    const jd = effectiveJd.length > 2500 ? effectiveJd.slice(0, 2500) : effectiveJd
    const candidateCtx = resume && resume.trim() ? resume.trim() : USER_BACKGROUND_CONTEXT
    const prompt = `You are a senior interview coach with a 90%+ offer rate. Your job is to write HIGH-CONVERSION interview answers — not just good answers, but answers specifically engineered to pass HR screening and move the candidate to the next round.\n\nCANDIDATE BACKGROUND (use this as the sole source of truth for their experiences — do not invent experiences not mentioned here):\n${candidateCtx}\n\nJOB DESCRIPTION:\n${jd}\n\nINTERVIEW TYPE: ${roleType}\nQuestion count: ${counts[roleType]} + 5 HR questions\n\nRULES FOR ALL ANSWERS:\n- First person, spoken — how a confident professional actually talks in an interview, not how they write a cover letter\n- NEVER open with "As an AWS-certified...", "I am excited about the opportunity", or "I am passionate about..."\n- Every claim must be backed by a specific experience from the candidate's background (project, tool, outcome)\n- Answers are 3-5 sentences — tight and purposeful, no filler\n- Technical/behavioral answers: lead with the situation or result, then the how\n\nHR QUESTIONS — PASS-OPTIMIZATION RULES:\nThese questions decide whether the candidate advances. Engineer each answer to send the right signal:\n\n1. "Tell me about yourself" — The interviewer wants: can you communicate clearly? does your background fit?\n   Formula: [1 sentence: who you are + most relevant credential] → [2 sentences: the specific experience from your background that is the strongest match for THIS job's core requirement] → [1 sentence: why THIS company specifically, referencing something from the JD]\n   Do NOT summarize your whole resume. End on why them.\n\n2. "What are your greatest strengths?" — The interviewer wants: are you self-aware? does your strength directly help us?\n   Formula: Name 1 strength → prove it with a specific example from the candidate's work → tie it to what this role needs\n   Choose the strength that overlaps most with the JD's core requirements.\n\n3. "What is your greatest weakness?" — The interviewer wants: are you self-aware? will this weakness hurt us?\n   Formula: Name a REAL weakness (not "I work too hard") → describe a specific moment it affected your work → explain the concrete habit or system you now use to manage it\n   Pick a weakness that is (a) genuine and (b) not a core requirement of this specific role.\n\n4. "Why do you want to work here?" — The interviewer wants: are you going to stay? did you do your research?\n   Formula: Reference 1-2 SPECIFIC things from the JD (tech stack, company mission, team structure, product) → connect it to the candidate's career goal → say what specific value you bring to them\n   Generic enthusiasm is an instant red flag. Be specific.\n\n5. "Where do you see yourself in 5 years?" — The interviewer wants: will you grow with us or leave in 1 year?\n   Formula: Realistic near-term goal (2 years) that deepens skills in THIS role → longer-term goal (5 years) that aligns with a growth path this company could provide → end by tying it back to this role as the right starting point\n   Show ambition without suggesting you'll leave for a different company or field.\n\nFor each HR question, also write a coaching_tip — 1-2 sentences explaining what psychological signal this answer sends to the interviewer and what to emphasize during delivery (e.g., pace, eye contact, specificity).\n\nThe hr_questions array must ALWAYS contain exactly these 5 questions in this order:\n1. "Tell me about yourself."\n2. "What are your greatest strengths?"\n3. "What is your greatest weakness?"\n4. "Why do you want to work here / why are you interested in this role?"\n5. "Where do you see yourself in 5 years?"\n\nReturn ONLY a valid JSON object with NO markdown, NO code fences, NO preamble:\n\n{\n  "technical_questions": [\n    { "question": "<question>", "suggested_answer": "<spoken answer referencing specific tech from JD and candidate background>" }\n  ],\n  "behavioral_questions": [\n    { "question": "<question>", "suggested_answer": "<spoken STAR answer using a realistic scenario from candidate background>" }\n  ],\n  "hr_questions": [\n    { "question": "<one of the 5 HR questions>", "suggested_answer": "<high-conversion spoken answer, sounds human>", "coaching_tip": "<what this answer signals + delivery tip>" }\n  ]\n}\n\nTechnical questions: reference specific tools/services from the JD. Behavioral questions: draw from realistic DevOps/cloud scenarios (on-call, deployments, incidents, cross-team collaboration, learning under pressure).`
    const r = await callAI(prompt, 'interview-prep', 2500, setAiLoading, setAiError, showToast)
    if (r) setResult({ technical_questions: Array.isArray(r.technical_questions) ? r.technical_questions : [], behavioral_questions: Array.isArray(r.behavioral_questions) ? r.behavioral_questions : [], hr_questions: Array.isArray(r.hr_questions) ? r.hr_questions : [], generatedAt: new Date().toISOString() })
  }

  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.amber}`, borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '15px', color: C.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Star size={15} style={{ color: C.amber }} /> Interview Prep
      </h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
        {!isEmbedded ? (
          <textarea value={jdText} onChange={e => setJdText(e.target.value)} disabled={loading}
            placeholder="Paste the job description here…" rows={5}
            style={{ flex: 1, background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '10px 12px', color: C.textPrimary, fontSize: '13px', lineHeight: 1.5, resize: 'vertical', opacity: loading ? 0.6 : 1 }} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: C.bgBase, border: `1px solid ${effectiveJd.trim() ? C.border : C.borderSubtle}`, borderRadius: '7px' }}>
            <Star size={13} style={{ color: effectiveJd.trim() ? C.amber : C.textGhost, flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: effectiveJd.trim() ? C.textSecondary : C.textGhost, margin: 0 }}>
              {effectiveJd.trim() ? 'Using job description from this application' : 'Add a job description in the form above to generate questions'}
            </p>
          </div>
        )}
        <select value={roleType} onChange={e => setRoleType(e.target.value)} disabled={loading}
          style={{ flexShrink: 0, background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '9px 12px', color: C.textPrimary, fontSize: '12px', cursor: 'pointer' }}>
          {['Technical', 'Hybrid', 'Behavioral-Heavy'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button onClick={generate} disabled={loading || (isEmbedded && !effectiveJd.trim())}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: (loading || (isEmbedded && !effectiveJd.trim())) ? C.bgElevated : C.amberDim, border: `1px solid ${(loading || (isEmbedded && !effectiveJd.trim())) ? C.border : C.amber}`, borderRadius: '7px', color: (loading || (isEmbedded && !effectiveJd.trim())) ? C.textSecondary : C.amber, fontSize: '13px', fontWeight: 500, cursor: (loading || (isEmbedded && !effectiveJd.trim())) ? 'not-allowed' : 'pointer' }}>
        {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : <><Star size={13} /> Generate Questions</>}
      </button>
      {loading && <AIShimmer />}
      {result && !loading && (
        <div style={{ marginTop: '18px' }}>
          {[
            { label: 'HR Questions', key: 'hr_questions', color: C.emerald, empty: 'No HR questions generated.' },
            { label: 'Technical Questions', key: 'technical_questions', color: C.cyan, empty: 'No technical questions generated for this role type.' },
            { label: 'Behavioral Questions', key: 'behavioral_questions', color: C.violet, empty: 'No behavioral questions generated.' }
          ].map(({ label, key, color, empty }) => (
            <div key={key} style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', color, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '8px', paddingBottom: '5px', borderBottom: `1px solid ${C.borderSubtle}` }}>
                {label} ({result[key]?.length || 0})
              </p>
              {!result[key]?.length
                ? <p style={{ fontSize: '12px', color: C.textGhost, fontStyle: 'italic' }}>{empty}</p>
                : result[key].map((q, i) => <AccordionItem key={i} question={q.question} answer={q.suggested_answer} index={i} tip={key === 'hr_questions' ? q.coaching_tip : undefined} />)
              }
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <p style={{ fontSize: '11px', color: C.textGhost }}>Generated {timeAgo(result.generatedAt)}</p>
            {onSave && <button onClick={() => onSave(result)} style={{ padding: '6px 14px', background: C.emeraldDim, border: `1px solid ${C.emerald}`, borderRadius: '6px', color: C.emerald, fontSize: '12px', fontWeight: 500 }}>Save to Application</button>}
          </div>
        </div>
      )}
    </div>
  )
}

function FollowUpEmailPanel({ job, showToast, aiLoading, setAiLoading, aiError, setAiError, onSave, resume = '' }) {
  const [result, setResult] = useState(job.followUpEmail || null)
  const [copied, setCopied] = useState(false)
  const loading = aiLoading['follow-up']

  const generate = async () => {
    if (!job.company || !job.role) { showToast('error', 'Job must have a company and role.'); return }
    const candidateCtx = resume && resume.trim() ? resume.trim() : USER_BACKGROUND_CONTEXT
    const prompt = `You are a professional career coach. Write a follow-up email for a job applicant after an interview.\n\n${candidateCtx}\n\nROLE APPLIED FOR: ${job.role} at ${job.company}\n\nWrite a concise, professional follow-up email. Return ONLY a valid JSON object with NO markdown, NO code fences, NO preamble:\n{\n  "subject": "<email subject line>",\n  "body": "<full email body, 3-4 short paragraphs, plain text>"\n}\n\nTone: warm, confident, not sycophantic. Mention gratitude for the interview, reaffirm interest in the role, briefly highlight one specific strength relevant to a cloud/DevOps role.`
    const r = await callAI(prompt, 'follow-up', 800, setAiLoading, setAiError, showToast)
    if (r) { setResult({ ...r, generatedAt: new Date().toISOString() }) }
  }

  const copy = async () => {
    if (!result) return
    const text = `Subject: ${result.subject}\n\n${result.body}`
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }

  return (
    <div style={{ background: C.bgSurface, border: `1px solid ${C.border}`, borderTop: `2px solid ${C.emerald}`, borderRadius: '10px', padding: '20px' }}>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: '15px', color: C.textPrimary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bell size={15} style={{ color: C.emerald }} /> Follow-up Email Draft
      </h3>
      <p style={{ fontSize: '12px', color: C.textGhost, marginBottom: '12px' }}>Generate a post-interview follow-up email for <span style={{ color: C.textSecondary }}>{job.role}</span> at <span style={{ color: C.cyan }}>{job.company}</span>.</p>
      <button onClick={generate} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: loading ? C.bgElevated : C.amberDim, border: `1px solid ${loading ? C.border : C.amber}`, borderRadius: '7px', color: loading ? C.textSecondary : C.amber, fontSize: '13px', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Drafting…</> : <><Bell size={13} /> Generate Email</>}
      </button>
      {loading && <AIShimmer />}
      {result && !loading && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '10px' }}>
            <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '4px' }}>Subject</p>
            <p style={{ fontSize: '13px', color: C.textPrimary, fontWeight: 500 }}>{result.subject}</p>
          </div>
          <div style={{ background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px 16px', marginBottom: '10px' }}>
            <p style={{ fontSize: '10px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '8px' }}>Body</p>
            <p style={{ fontSize: '13px', color: C.textSecondary, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{result.body}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={copy} style={{ padding: '6px 14px', background: copied ? C.emeraldDim : C.bgElevated, border: `1px solid ${copied ? C.emerald : C.border}`, borderRadius: '6px', color: copied ? C.emerald : C.textSecondary, fontSize: '12px', fontWeight: 500 }}>
              {copied ? '✓ Copied' : 'Copy Email'}
            </button>
            {onSave && <button onClick={() => onSave(result)} style={{ padding: '6px 14px', background: C.amberDim, border: `1px solid ${C.amber}`, borderRadius: '6px', color: C.amber, fontSize: '12px', fontWeight: 500 }}>Save to Application</button>}
            <span style={{ fontSize: '11px', color: C.textGhost, marginLeft: 'auto' }}>Generated {timeAgo(result.generatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function AIResultsPanel({ job, onUpdateJob, showToast, aiLoading, setAiLoading, aiError, setAiError, resume = '' }) {
  const [tab, setTab] = useState('analysis')
  const hasJd = !!job.jdText?.trim()
  const tabs = [
    { id: 'analysis',     label: 'JD Analysis',     color: C.cyan,    dot: !!job.aiAnalysis   },
    { id: 'cover-letter', label: 'Cover Letter',     color: C.violet,  dot: !!job.coverLetter  },
    { id: 'interview',    label: 'Interview Prep',   color: C.amber,   dot: !!job.interviewPrep},
    { id: 'follow-up',    label: 'Follow-up Email',  color: C.emerald, dot: !!job.followUpEmail},
  ]
  return (
    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.borderSubtle}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: C.textGhost, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>AI Tools</p>
        {!hasJd && <p style={{ fontSize: '11px', color: C.textGhost }}>Add a Job Description above to unlock AI analysis</p>}
      </div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ position: 'relative', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, border: `1px solid ${tab === t.id ? t.color : C.border}`, background: tab === t.id ? `${t.color}18` : 'transparent', color: tab === t.id ? t.color : C.textSecondary, cursor: 'pointer' }}>
            {t.label}
            {t.dot && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '5px', height: '5px', borderRadius: '50%', background: t.color }} />}
          </button>
        ))}
      </div>
      {tab === 'analysis'    && <JDAnalyzerPanel initialJdText={job.jdText || ''} initialResult={job.aiAnalysis} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={r => onUpdateJob({ aiAnalysis: r })} resume={resume} embeddedJdText={job.jdText ?? ''} />}
      {tab === 'cover-letter'&& <CoverLetterPanel initialCompany={job.company} initialRole={job.role} initialJdText={job.jdText || ''} initialResult={job.coverLetter ? { cover_letter: job.coverLetter } : null} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={text => onUpdateJob({ coverLetter: text })} resume={resume} embeddedJdText={job.jdText ?? ''} embeddedCompany={job.company ?? ''} embeddedRole={job.role ?? ''} />}
      {tab === 'interview'   && <InterviewPrepPanel initialJdText={job.jdText || ''} initialResult={job.interviewPrep} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={r => onUpdateJob({ interviewPrep: r })} resume={resume} embeddedJdText={job.jdText ?? ''} />}
      {tab === 'follow-up'   && <FollowUpEmailPanel job={job} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={r => onUpdateJob({ followUpEmail: r })} resume={resume} />}
    </div>
  )
}

function AIToolsView({ showToast, aiLoading, setAiLoading, aiError, setAiError, settings }) {
  const [activeTool, setActiveTool] = useState('jd-analyzer')

  const tools = [
    { id: 'jd-analyzer',    label: 'JD Fit Analyzer',  Icon: Search,   color: C.cyan,   dim: C.cyanDim   },
    { id: 'cover-letter',   label: 'Cover Letter',      Icon: FileText, color: C.violet, dim: C.violetDim },
    { id: 'interview-prep', label: 'Interview Prep',    Icon: Star,     color: C.amber,  dim: C.amberDim  },
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '22px', color: C.textPrimary, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Zap size={20} style={{ color: C.cyan }} /> AI Tools
        </h1>
        <p style={{ fontSize: '13px', color: C.textSecondary, marginTop: '4px' }}>AI-powered tools to maximize your application quality</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', padding: '4px', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '10px', width: 'fit-content' }}>
        {tools.map(({ id, label, Icon, color, dim }) => {
          const active = activeTool === id
          return (
            <button key={id} onClick={() => setActiveTool(id)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 16px', background: active ? dim : 'transparent', border: `1px solid ${active ? color + '44' : 'transparent'}`, borderRadius: '7px', color: active ? color : C.textSecondary, fontSize: '13px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      <div style={{ maxWidth: '860px' }}>
        {activeTool === 'jd-analyzer'    && <JDAnalyzerPanel initialJdText="" initialResult={null} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={null} resume={settings?.resume || ''} />}
        {activeTool === 'cover-letter'   && <CoverLetterPanel initialCompany="" initialRole="" initialJdText="" initialResult={null} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={null} resume={settings?.resume || ''} />}
        {activeTool === 'interview-prep' && <InterviewPrepPanel initialJdText="" initialResult={null} showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} onSave={null} resume={settings?.resume || ''} />}
      </div>
    </div>
  )
}

function WeeklyReportModal({ jobs, settings, onClose }) {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now); monday.setDate(now.getDate() - day + 1); monday.setHours(0, 0, 0, 0)
  const thisWeek = jobs.filter(j => j.dateApplied && new Date(j.dateApplied) >= monday)
  const active = jobs.filter(j => ACTIVE_STATUSES.includes(j.status))
  const responded = jobs.filter(j => ['screening', 'interview', 'offer'].includes(j.status))
  const responseRate = active.length > 0 ? Math.round(responded.length / active.length * 100) : 0
  const breakdown = STATUSES.map(s => ({ label: STATUS_CONFIG[s].label, count: jobs.filter(j => j.status === s).length })).filter(x => x.count > 0)
  const recent = [...jobs].sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity)).slice(0, 5)
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const report = [
    `JOB HUNT WEEKLY REPORT — ${dateStr}`,
    '─'.repeat(48),
    '',
    `APPLICATIONS THIS WEEK : ${thisWeek.length} / ${settings.weeklyGoal} goal`,
    `OVERALL RESPONSE RATE  : ${responseRate}%`,
    `TOTAL APPLICATIONS     : ${jobs.length}`,
    '',
    'PIPELINE BREAKDOWN:',
    ...breakdown.map(x => `  ${x.label.padEnd(12)} ${x.count}`),
    '',
    'RECENT ACTIVITY:',
    ...recent.map(j => `  ${j.company} — ${j.role} [${STATUS_CONFIG[j.status]?.label || j.status}]`),
    '',
    '─'.repeat(48),
    'Generated by Job Hunt Command Center',
  ].join('\n')

  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* ignore */ }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '90%', maxWidth: '560px', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '12px', zIndex: 1001, padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'slideUp 0.2s ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '16px', color: C.textPrimary }}>Weekly Report</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textGhost, padding: '4px', display: 'flex' }}><X size={18} /></button>
        </div>
        <textarea readOnly value={report} rows={18}
          style={{ width: '100%', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '7px', padding: '12px 14px', color: C.textPrimary, fontSize: '12px', lineHeight: 1.65, fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box', resize: 'none' }} />
        <button onClick={copy}
          style={{ marginTop: '12px', padding: '8px 20px', background: copied ? C.emeraldDim : C.cyanDim, border: `1px solid ${copied ? C.emerald : C.cyan}`, borderRadius: '6px', color: copied ? C.emerald : C.cyan, fontSize: '13px', fontWeight: 500 }}>
          {copied ? '✓ Copied' : 'Copy Report'}
        </button>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL IMPORT MODAL
// ─────────────────────────────────────────────────────────────────────────────

function EmailImportModal({ onClose, onImportJobs, showToast, existingJobs }) {
  const [emailText, setEmailText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(null) // array of extracted job objects
  const [importing, setImporting] = useState(false)
  const [removed, setRemoved] = useState(new Set())

  const parse = async () => {
    if (!emailText.trim()) { showToast('error', 'Paste some email text first.'); return }
    setParsing(true)
    setParsed(null)
    setRemoved(new Set())
    try {
      const prompt = `You are a job application data extractor. The user will paste text related to job applications — this could be email confirmations, job site webpage text, "application submitted" confirmations, recruiter messages, or any mix of these. Sources include LinkedIn, JobStreet, BossJob, Indeed, Amazon Jobs, or company career pages.\n\nYour job: extract EVERY job application you can identify. Be generous — if you see a job title and company together in any context suggesting an application was submitted, extract it.\n\nFor each job found, return:\n- company: company name (string, required)\n- role: job title / position name (string, required)\n- dateApplied: date in YYYY-MM-DD format. Infer from any date in the text. If none found, use today: ${new Date().toISOString().slice(0,10)}\n- source: pick the closest match from exactly ["LinkedIn","JobStreet","AWS Partner Network","Company Website","Referral","Other"]\n- status: always "applied"\n\nReturn ONLY a valid JSON array with no markdown, no code fences, no explanation, no preamble. If truly nothing looks like a job application, return [].\n\nExamples of text you should successfully parse:\n- "Application submitted — Cloud Engineer — Acme Corp" → extract it\n- "Your application to DevOps Engineer at Tech Inc has been received" → extract it\n- "Applied: SRE, Google, via LinkedIn" → extract it\n\nTEXT TO PARSE:\n${emailText.slice(0, 8000)}`
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
      })
      if (!res.ok) { const err = await res.text(); console.error('[EmailImport] API error', res.status, err); throw new Error(`API ${res.status}`) }
      const data = await res.json()
      const raw = data.choices[0].message.content.trim()
      console.log('[EmailImport] raw AI response:', raw)
      // strip markdown fences if present
      const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
      // fallback: extract first [...] array from the text
      const match = jsonStr.match(/\[[\s\S]*\]/)
      if (!match) { console.error('[EmailImport] no JSON array found in:', jsonStr); throw new SyntaxError('No array') }
      const jobs = JSON.parse(match[0])
      if (!Array.isArray(jobs)) throw new SyntaxError('Not an array')
      if (jobs.length === 0) { showToast('info', 'No job applications found in that text.'); setParsing(false); return }
      setParsed(jobs)
    } catch (e) {
      console.error('[EmailImport] parse error:', e)
      showToast('error', e instanceof SyntaxError ? 'AI returned unexpected format — check console for details.' : `Parsing failed: ${e.message}`)
    }
    setParsing(false)
  }

  const isDuplicate = (j) => existingJobs.some(
    e => e.company.toLowerCase() === j.company.toLowerCase() && e.role.toLowerCase() === j.role.toLowerCase()
  )

  const handleImport = async () => {
    const toImport = parsed.filter((_, i) => !removed.has(i))
    if (!toImport.length) { showToast('error', 'Nothing selected to import.'); return }
    setImporting(true)
    let count = 0
    for (const j of toImport) {
      const result = await onImportJobs(j)
      if (result) count++
    }
    showToast('success', `Imported ${count} job${count !== 1 ? 's' : ''} from email.`)
    setImporting(false)
    onClose()
  }

  const visible = parsed ? parsed.filter((_, i) => !removed.has(i)) : []

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '92%', maxWidth: '580px', maxHeight: '88vh', background: C.bgSurface, border: `1px solid ${C.border}`, borderRadius: '12px', zIndex: 1001, boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'slideUp 0.2s ease-out', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: '16px', color: C.textPrimary }}>Import from Email / Job Site</h2>
            <p style={{ fontSize: '12px', color: C.textGhost, marginTop: '2px' }}>Paste emails, confirmation pages, or any job application text — AI extracts all applications</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.textGhost, padding: '4px', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!parsed ? (
            <>
              <p style={{ fontSize: '12px', color: C.textSecondary, lineHeight: 1.6 }}>
                Paste anything: Gmail confirmations, JobStreet "Application submitted" pages, LinkedIn notifications, or just a list of jobs you applied to. Mix and match — AI figures it out.
              </p>
              <textarea
                value={emailText}
                onChange={e => setEmailText(e.target.value)}
                disabled={parsing}
                placeholder={'Subject: Your application to Acme Corp has been received\nFrom: noreply@acmecorp.com\nDate: April 20, 2026\n\nHi Xiang, thank you for applying for the DevOps Engineer role…\n\n--- paste more emails below ---'}
                rows={10}
                style={{ width: '100%', background: C.bgBase, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '12px 14px', color: C.textPrimary, fontSize: '12px', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', fontFamily: "'JetBrains Mono', monospace", opacity: parsing ? 0.6 : 1 }}
              />
              <button onClick={parse} disabled={parsing}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', background: parsing ? C.bgElevated : C.cyanDim, border: `1px solid ${parsing ? C.border : C.cyan}`, borderRadius: '8px', color: parsing ? C.textSecondary : C.cyan, fontSize: '13px', fontWeight: 600, cursor: parsing ? 'not-allowed' : 'pointer' }}>
                {parsing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Parsing…</> : <><Zap size={14} /> Parse with AI</>}
              </button>
              {parsing && <AIShimmer />}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '13px', color: C.textPrimary, fontWeight: 500 }}>Found <span style={{ color: C.cyan }}>{parsed.length}</span> job application{parsed.length !== 1 ? 's' : ''}</p>
                <button onClick={() => { setParsed(null); setEmailText('') }} style={{ fontSize: '11px', color: C.textGhost, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}>← Paste again</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {parsed.map((j, i) => {
                  const isRemoved = removed.has(i)
                  const isDup = isDuplicate(j)
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: isRemoved ? 'transparent' : C.bgElevated, border: `1px solid ${isRemoved ? C.borderSubtle : isDup ? C.amber + '55' : C.border}`, borderRadius: '8px', opacity: isRemoved ? 0.4 : 1, transition: 'all 0.15s' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '13px', color: C.textPrimary, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{j.company}</span>
                          {isDup && <span style={{ fontSize: '10px', color: C.amber, background: C.amberDim, border: `1px solid ${C.amber}44`, borderRadius: '4px', padding: '1px 6px' }}>duplicate</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12px', color: C.textSecondary }}>{j.role}</span>
                          <span style={{ fontSize: '11px', color: C.textGhost, fontFamily: "'JetBrains Mono', monospace" }}>{j.dateApplied}</span>
                          <span style={{ fontSize: '11px', color: C.textGhost }}>{j.source}</span>
                        </div>
                      </div>
                      <button onClick={() => setRemoved(p => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n })}
                        style={{ background: 'none', border: 'none', color: isRemoved ? C.emerald : C.textGhost, padding: '4px', display: 'flex', flexShrink: 0, cursor: 'pointer' }}>
                        {isRemoved ? <Plus size={15} /> : <X size={15} />}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {parsed && (
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', color: C.textGhost }}>{visible.length} of {parsed.length} will be imported</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onClose} style={{ padding: '8px 18px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.textSecondary, fontSize: '13px' }}>Cancel</button>
              <button onClick={handleImport} disabled={importing || !visible.length}
                style={{ padding: '8px 20px', background: visible.length ? C.cyanDim : C.bgElevated, border: `1px solid ${visible.length ? C.cyan : C.border}`, borderRadius: '6px', color: visible.length ? C.cyan : C.textGhost, fontSize: '13px', fontWeight: 600, cursor: visible.length ? 'pointer' : 'not-allowed', opacity: importing ? 0.7 : 1 }}>
                {importing ? 'Importing…' : `Import ${visible.length} Job${visible.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [storageReady, setStorageReady] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [jobs, setJobs]           = useState([])
  const [settings, setSettings]   = useState(DEFAULT_SETTINGS)
  const jobsRef = useRef([])
  useEffect(() => { jobsRef.current = jobs }, [jobs])

  const [view, setView]                     = useState('dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(() => window.innerWidth >= 1024)

  const [selectedJob, setSelectedJob] = useState(null)
  const [modalMode, setModalMode]     = useState('view')

  const [tableFilters, setTableFilters] = useState({
    search: '', statuses: [], sources: [], dateFrom: null, dateTo: null,
    sortColumn: 'lastActivity', sortDir: 'desc',
  })

  const [aiLoading, setAiLoading] = useState({ 'jd-analyzer': false, 'cover-letter': false, 'interview-prep': false, 'follow-up': false })
  const [aiError, setAiError]     = useState({ 'jd-analyzer': null, 'cover-letter': null, 'interview-prep': null, 'follow-up': null })

  const [standaloneAI, setStandaloneAI] = useState({ jdText: '', company: '', role: '', roleType: 'Hybrid', analysisResult: null, coverLetterResult: null, interviewPrepResult: null })

  const [toasts, setToasts] = useState([])

  // ── Drag state ─────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false)
  const [showEmailImport, setShowEmailImport] = useState(false)

  const [dragInfo, setDragInfo]           = useState(null) // { jobId, originStatus, startX, startY }
  const [dragPos, setDragPos]             = useState({ x: 0, y: 0 })
  const [dragOverStatus, setDragOverStatus] = useState(null)

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const showToast = useCallback((type, message) => {
    const id = generateId('toast')
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const dismissToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const ids = await storageGet('jobs:index', [])
      const results = await Promise.allSettled(ids.map(id => storageGet(`jobs:${id}`, null)))
      const loadedJobs = results.filter(r => r.status === 'fulfilled' && r.value !== null).map(r => r.value)
      const validIds = loadedJobs.map(j => j.id)
      if (validIds.length !== ids.length) await storageSet('jobs:index', validIds)
      const loadedSettings = await storageGet('settings:profile', DEFAULT_SETTINGS)
      const savedTheme = await storageGet('settings:theme', 'dark')
      _themeColors = savedTheme === 'light' ? LIGHT : DARK

      // Drain userscript quick-add queue (written to localStorage by jhcc-tracker.user.js)
      try {
        const raw = localStorage.getItem('jhcc-quick-add-queue')
        if (raw) {
          localStorage.removeItem('jhcc-quick-add-queue')
          const queued = JSON.parse(raw)
          for (const item of queued) {
            const now = new Date().toISOString()
            const job = {
              ...DEFAULT_JOB,
              id: generateId('job'),
              status: 'saved',
              company: item.company || '',
              role: item.role || '',
              url: item.url || '',
              source: SOURCES.includes(item.source) ? item.source : 'Other',
              dateSaved: now.slice(0, 10),
              lastActivity: now,
            }
            await storageSet(`jobs:${job.id}`, job)
            loadedJobs.unshift(job)
          }
          await storageSet('jobs:index', [...validIds, ...loadedJobs.slice(0, queued.length).map(j => j.id)])
        }
      } catch (e) { console.error('[quickAdd queue]', e) }

      setTheme(savedTheme)
      setJobs(loadedJobs)
      setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings })
      setStorageReady(true)

      // Bookmarklet prefill — open Add Job modal with extracted data
      const params = new URLSearchParams(window.location.hash.slice(1))
      if (params.get('addJob') === '1') {
        window.history.replaceState({}, '', window.location.pathname)
        const source = params.get('source') || 'Other'
        setSelectedJob({
          ...DEFAULT_JOB,
          status: 'saved',
          company: params.get('company') || '',
          role: params.get('role') || '',
          url: params.get('url') || '',
          source: SOURCES.includes(source) ? source : 'Other',
        })
        setModalMode('add')
      }
    }
    init()
  }, [])

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const addJob = useCallback(async (jobData) => {
    const now = new Date().toISOString()
    const job = { ...DEFAULT_JOB, ...jobData, id: generateId('job'), dateSaved: now.slice(0,10), lastActivity: now }
    if (ACTIVE_STATUSES.includes(job.status) && !job.dateApplied) job.dateApplied = now.slice(0, 10)
    const dup = jobsRef.current.find(j =>
      j.company.toLowerCase() === job.company.toLowerCase() &&
      j.role.toLowerCase() === job.role.toLowerCase()
    )
    if (dup) showToast('info', `Possible duplicate: "${job.role}" at ${job.company} already exists.`)
    setJobs(prev => [job, ...prev])
    const saved = await storageSet(`jobs:${job.id}`, job)
    if (!saved) { setJobs(prev => prev.filter(j => j.id !== job.id)); showToast('error', 'Failed to save — check your connection.'); return null }
    const ids = await storageGet('jobs:index', [])
    await storageSet('jobs:index', [...ids, job.id])
    showToast('success', `Added "${job.role}" at ${job.company}`)
    return job
  }, [showToast])

  // Drain quick-add queue from userscript when JHCC is already open (cross-tab storage event)
  useEffect(() => {
    const drain = async () => {
      try {
        const raw = localStorage.getItem('jhcc-quick-add-queue')
        if (!raw) return
        localStorage.removeItem('jhcc-quick-add-queue')
        const queued = JSON.parse(raw)
        for (const item of queued) {
          await addJob({ company: item.company || '', role: item.role || '', url: item.url || '', source: item.source || 'Other', status: 'saved' })
        }
      } catch (e) { console.error('[quickAdd drain]', e) }
    }
    const handler = (e) => { if (e.key === 'jhcc-quick-add-queue' && e.newValue) drain() }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [addJob])

  const updateJob = useCallback(async (id, changes) => {
    const prev = jobsRef.current.find(j => j.id === id)
    if (!prev) return null
    const updated = { ...prev, ...changes, lastActivity: new Date().toISOString() }
    if (ACTIVE_STATUSES.includes(updated.status) && !updated.dateApplied) updated.dateApplied = new Date().toISOString().slice(0, 10)
    setJobs(pj => pj.map(j => j.id === id ? updated : j))
    const saved = await storageSet(`jobs:${id}`, updated)
    if (!saved) { setJobs(pj => pj.map(j => j.id === id ? prev : j)); showToast('error', 'Failed to update.'); return null }
    return updated
  }, [showToast])

  const deleteJob = useCallback(async (id) => {
    const prev = jobsRef.current.find(j => j.id === id)
    if (!prev) return false
    setJobs(pj => pj.filter(j => j.id !== id))
    await storageDelete(`jobs:${id}`)
    const ids = await storageGet('jobs:index', [])
    const indexed = await storageSet('jobs:index', ids.filter(i => i !== id))
    if (!indexed) { setJobs(pj => [prev, ...pj]); showToast('error', 'Failed to delete.'); return false }
    showToast('success', `Deleted "${prev.role}" at ${prev.company}`)
    return true
  }, [showToast])

  const saveSettings = useCallback(async (changes) => {
    const prev = settings
    const updated = { ...prev, ...changes }
    setSettings(updated)
    const saved = await storageSet('settings:profile', updated)
    if (!saved) { setSettings(prev); showToast('error', 'Failed to save settings.'); return false }
    showToast('success', 'Settings saved.')
    return true
  }, [settings, showToast])

  const handleImport = useCallback(async (data) => {
    try {
      const importedJobs = data.jobs || []
      const importedSettings = data.settings || {}
      await Promise.all(importedJobs.map(j => storageSet(`jobs:${j.id}`, j)))
      await storageSet('jobs:index', importedJobs.map(j => j.id))
      const merged = { ...DEFAULT_SETTINGS, ...importedSettings }
      await storageSet('settings:profile', merged)
      setJobs(importedJobs)
      setSettings(merged)
      showToast('success', `Imported ${importedJobs.length} application${importedJobs.length !== 1 ? 's' : ''}.`)
    } catch (e) {
      showToast('error', 'Import failed — invalid file format.')
    }
  }, [showToast])

  // ── Theme toggle ───────────────────────────────────────────────────────────
  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    _themeColors = next === 'dark' ? DARK : LIGHT
    setTheme(next)
    await storageSet('settings:theme', next)
  }, [theme])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = useCallback((job, mode = 'view') => { setSelectedJob(job); setModalMode(mode) }, [])
  const openAddModal = useCallback((status = 'saved', prefill = {}) => { setSelectedJob({ ...DEFAULT_JOB, status, ...prefill }); setModalMode('add') }, [])
  const closeModal = useCallback(() => setSelectedJob(null), [])

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openAddModal() }
      if (e.key === '/') { e.preventDefault(); setView('table') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openAddModal])

  // ── Drag and drop ──────────────────────────────────────────────────────────
  const handleCardPointerDown = useCallback((e, job) => {
    setDragInfo({ jobId: job.id, originStatus: job.status, startX: e.clientX, startY: e.clientY })
    setDragPos({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    if (!dragInfo) return
    let overStatus = null

    const onMove = (e) => {
      setDragPos({ x: e.clientX, y: e.clientY })
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const col = el?.closest('[data-kanban-status]')
      overStatus = col?.dataset.kanbanStatus || null
      setDragOverStatus(overStatus)
    }

    const onUp = (e) => {
      const moved = Math.hypot(e.clientX - dragInfo.startX, e.clientY - dragInfo.startY) > 8
      if (moved) {
        if (overStatus && overStatus !== dragInfo.originStatus) updateJob(dragInfo.jobId, { status: overStatus })
      } else {
        const job = jobsRef.current.find(j => j.id === dragInfo.jobId)
        if (job) openModal(job)
      }
      setDragInfo(null)
      setDragOverStatus(null)
      overStatus = null
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [dragInfo, updateJob, openModal])

  const ghostJob = dragInfo ? jobs.find(j => j.id === dragInfo.jobId) : null

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!storageReady) return <LoadingScreen />

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bgBase, color: C.textPrimary, fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>
      <style>{GLOBAL_STYLES}</style>

      <Sidebar view={view} setView={setView} expanded={sidebarExpanded} setExpanded={setSidebarExpanded} jobs={jobs} onSettingsOpen={() => setShowSettings(true)} theme={theme} onThemeToggle={toggleTheme} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {view === 'dashboard' && <DashboardView jobs={jobs} settings={settings} setView={setView} setTableFilters={setTableFilters} updateJob={updateJob} onAddClick={openAddModal} onEmailImport={() => setShowEmailImport(true)} />}
        {view === 'kanban'    && <KanbanView jobs={jobs} draggingJobId={dragInfo?.jobId} dragOverStatus={dragOverStatus} onPointerDown={handleCardPointerDown} onAddClick={openAddModal} />}
        {view === 'table'     && <TableView jobs={jobs} filters={tableFilters} setFilters={setTableFilters} onRowClick={(job) => openModal(job)} />}
        {view === 'ai-tools'  && <AIToolsView showToast={showToast} aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError} settings={settings} />}
      </div>

      {/* Modal */}
      {selectedJob && (
        <JobModal
          key={selectedJob.id || 'new'}
          job={selectedJob}
          initialMode={modalMode}
          onClose={closeModal}
          onSave={async (data) => {
            if (modalMode === 'add') await addJob(data)
            else await updateJob(selectedJob.id, data)
            closeModal()
          }}
          onDelete={async () => {
            await deleteJob(selectedJob.id)
            closeModal()
          }}
          showToast={showToast}
          aiLoading={aiLoading}
          setAiLoading={setAiLoading}
          aiError={aiError}
          setAiError={setAiError}
          onUpdateJob={(changes) => updateJob(selectedJob.id, changes)}
          resume={settings?.resume || ''}
        />
      )}

      {/* Drag ghost card */}
      {dragInfo && ghostJob && (
        <div style={{ position: 'fixed', left: dragPos.x - 110, top: dragPos.y - 40, width: '220px', pointerEvents: 'none', zIndex: 9998, transform: 'rotate(2deg)', opacity: 0.92 }}>
          <JobCard job={ghostJob} isDragging={false} onPointerDown={() => {}} />
        </div>
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          saveSettings={saveSettings}
          jobs={jobs}
          onClose={() => setShowSettings(false)}
          onImport={handleImport}
        />
      )}

      {showEmailImport && (
        <EmailImportModal
          onClose={() => setShowEmailImport(false)}
          onImportJobs={addJob}
          showToast={showToast}
          existingJobs={jobs}
        />
      )}

      {/* Global Add Job FAB */}
      <button
        onClick={() => openAddModal('saved')}
        title="Add Job"
        style={{ position: 'fixed', bottom: '24px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: C.cyan, border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, boxShadow: `0 4px 20px ${C.cyan}55`, cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = `0 6px 28px ${C.cyan}88` }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 20px ${C.cyan}55` }}
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
