// ============================================================
// 搞钱局 — domain model
// A flat, jsonb-friendly shape (mirrors the 花迹 pattern) so the
// same object round-trips through localStorage and Supabase.
// ============================================================

export type Visibility = 'public' | 'team' | 'private'
export type EntryType = 'income' | 'attempt' | 'action' | 'milestone'

/** How well an income claim is backed. Drives 真实榜 eligibility + 诚信分. */
export type ProofLevel = 'none' | 'screenshot' | 'multi' | 'verified'

export type IncomeSourceId =
  | 'salary' | 'side' | 'freelance' | 'project' | 'ecom'
  | 'content' | 'invest' | 'passive' | 'windfall' | 'other'

export type AttemptCategoryId =
  | 'side' | 'product' | 'gig' | 'learn' | 'invest' | 'pivot' | 'partner' | 'content' | 'other'

export type VentureStatus = 'idea' | 'active' | 'working' | 'paused' | 'done' | 'abandoned'
export type VentureOutcome = 'win' | 'lose' | 'ongoing'
export type EffortUnit = 'hour' | 'point' | 'task'

export interface Proof {
  id: string
  kind: 'image' | 'link' | 'text'
  url?: string // data URL (local) or Supabase Storage URL
  label?: string
  addedAt: string
}

export interface EntryEdit {
  at: string
  field: string
  from?: string | number
  to?: string | number
}

/** The universal log record. Type-specific fields are optional. */
export interface Entry {
  id: string
  ownerId: string
  type: EntryType
  title: string
  note?: string
  occurredAt: string // when it really happened → which month it counts toward
  createdAt: string
  updatedAt?: string
  proofs: Proof[]
  visibility: Visibility
  ventureId?: string
  history?: EntryEdit[]

  // income
  amount?: number // ¥, always positive
  source?: IncomeSourceId
  recurring?: boolean
  proofLevel?: ProofLevel

  // attempt / venture (副本)
  category?: AttemptCategoryId
  status?: VentureStatus
  investMoney?: number
  investHours?: number
  outcome?: VentureOutcome
  lesson?: string
  startedAt?: string

  // action (工作量)
  effort?: number
  effortUnit?: EffortUnit
  count?: number

  // milestone
  kind?: string
}

/** User-defined trackable metric — "支持添加各种数据类型". */
export interface CustomMetric {
  id: string
  ownerId: string
  name: string
  unit: string
  kind: 'number' | 'currency' | 'percent' | 'count'
  direction: 'up' | 'down' // higher-is-better vs lower-is-better
  emoji?: string
  color?: string
  createdAt: string
}

export interface MetricPoint {
  id: string
  metricId: string
  ownerId: string
  value: number
  at: string
  note?: string
}

export interface Endorsement {
  id: string
  fromId: string
  toId: string
  entryId?: string
  note?: string
  at: string
}

export interface Profile {
  id: string
  handle: string
  name: string
  avatar: string // emoji
  city?: string
  bio?: string
  joinedAt: string
  goalMonthly?: number // target monthly income (¥)
  teamId?: string
  visibility: 'public' | 'anon'
  authProvider?: 'demo' | 'email' | 'phone' | 'wechat'
  isDemo?: boolean

  // snapshot fields kept for others' leaderboards (self-derived live from entries)
  snapMonthIncome?: number
  snapVerifiedMonthIncome?: number
  snapCurrentTier?: string
  snapPeakTier?: string
  snapVerifiedTier?: string
  snapMomentum?: number
  snapEffortWeek?: number
  snapStreakMonths?: number
  snapIntegrity?: number
  snapLevel?: number
  snapTitles?: string[]
}

export interface Team {
  id: string
  name: string
  emoji: string
  city?: string
  motto?: string
  ownerId: string
  memberIds: string[]
  createdAt: string
  isDemo?: boolean
}

export interface MeetEvent {
  id: string
  title: string
  city: string
  location: string
  startAt: string
  hostId: string
  teamId?: string
  capacity: number
  tags: string[]
  description: string
  attendeeIds: string[]
  createdAt: string
  isDemo?: boolean
}

export type FeedKind =
  | 'income' | 'rankup' | 'breakthrough' | 'milestone' | 'venture' | 'event' | 'join' | 'streak'

export interface FeedItem {
  id: string
  actorId: string
  kind: FeedKind
  text: string
  amount?: number
  tierId?: string
  at: string
  cheers: string[]
  isDemo?: boolean
}

export interface Comment {
  id: string
  feedId: string
  authorId: string
  text: string
  at: string
  isDemo?: boolean
}

export interface Season {
  id: string
  name: string
  startAt: string
  endAt: string
}

// ---------- tier ladder ----------
export interface TierDef {
  id: string
  name: string
  index: number
  threshold: number // monthly ¥ to reach this tier
  rankLabel: string // familiar metaphor (青铜/白银/…)
  emoji: string
  subtitle: string
  color: string
  gradient: [string, string]
  glow: string
}

// ---------- derived, in-memory only ----------
export interface Breakthrough {
  monthKey: string
  amount: number
  multiple: number // vs baseline
  tierJump: number // tiers gained that month
  label: string
}

export interface MonthPoint {
  key: string // YYYY-MM
  label: string
  income: number
  verifiedIncome: number
  tierIndex: number
  effort: number
  isBreakthrough: boolean
}

export interface PlayerStats {
  monthIncome: number
  verifiedMonthIncome: number
  monthGoal?: number
  goalProgress: number // 0..1
  currentTier: TierDef
  peakTier: TierDef
  verifiedTier: TierDef
  nextTier?: TierDef
  tierProgress: number // 0..1 toward next tier
  momentum: number // signed % vs previous month
  breakthroughs: Breakthrough[]
  streakDays: number
  streakMonths: number
  level: number
  xp: number
  xpInLevel: number
  xpToNext: number
  integrity: number
  totalIncome: number
  activeVentures: number
  monthlySeries: MonthPoint[]
  composition: { source: IncomeSourceId; amount: number }[]
  diversification: number // 0..1 (Gini-ish inverse)
  hourlyRate?: number
  effortWeek: number
  titles: string[]
}

export interface Catalog<T extends string> {
  id: T
  label: string
  emoji: string
  color: string
}
