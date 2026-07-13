import type {
  Entry, Profile, PlayerStats, MonthPoint, Breakthrough, IncomeSourceId,
} from '../types'
import { tierForIncome, tierByIndex, nextTier, tierProgress } from './tiers'
import { monthKey, shiftMonth, monthLabel, startOfDay } from './format'

export interface StatsAux {
  endorsementsGiven: number
  endorsementsReceived: number
  eventsAttended: number
}

const MONTH_FLOOR = 3000 // baseline floor so breakthrough math never divides by ~0
const SERIES_MONTHS = 18

function isVerified(e: Entry): boolean {
  if (e.type !== 'income') return false
  if (e.proofLevel && e.proofLevel !== 'none') return true
  return (e.proofs?.length ?? 0) > 0
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function levelFromXp(xp: number): { level: number; xpInLevel: number; xpToNext: number } {
  let level = 1
  let need = 120
  let acc = 0
  while (xp >= acc + need) {
    acc += need
    level++
    need = Math.round(need * 1.32)
  }
  return { level, xpInLevel: xp - acc, xpToNext: need }
}

function sumWindow(income: Entry[], now: Date, fromDays: number, toDays: number): number {
  const to = now.getTime() - toDays * 86400000
  const from = now.getTime() - fromDays * 86400000
  let s = 0
  for (const e of income) {
    const t = new Date(e.occurredAt).getTime()
    if (t > from && t <= to + 86400000) s += e.amount ?? 0
  }
  return s
}

export function computeStats(
  profile: Profile,
  entries: Entry[],
  aux: StatsAux,
  now: Date = new Date(),
): PlayerStats {
  const income = entries.filter((e) => e.type === 'income' && (e.amount ?? 0) > 0)
  const attempts = entries.filter((e) => e.type === 'attempt')

  // ---- monthly aggregation ----
  const byMonth = new Map<string, { income: number; verified: number; effort: number }>()
  const bump = (k: string, patch: Partial<{ income: number; verified: number; effort: number }>) => {
    const cur = byMonth.get(k) ?? { income: 0, verified: 0, effort: 0 }
    byMonth.set(k, {
      income: cur.income + (patch.income ?? 0),
      verified: cur.verified + (patch.verified ?? 0),
      effort: cur.effort + (patch.effort ?? 0),
    })
  }
  for (const e of income) {
    const k = monthKey(e.occurredAt)
    bump(k, { income: e.amount, verified: isVerified(e) ? e.amount : 0 })
  }
  for (const e of entries) {
    if (e.type === 'action' && e.effort) bump(monthKey(e.occurredAt), { effort: e.effort })
  }

  const curKey = monthKey(now)
  const monthIncome = byMonth.get(curKey)?.income ?? 0
  const verifiedMonthIncome = byMonth.get(curKey)?.verified ?? 0

  // ---- current tier: spike-sensitive but doesn't collapse mid-month ----
  const last3 = [1, 2, 3].map((n) => byMonth.get(shiftMonth(curKey, -n))?.income ?? 0)
  const settled = median(last3.filter((_, i) => byMonth.has(shiftMonth(curKey, -(i + 1)))))
  const currentTierIndex = Math.max(tierForIncome(monthIncome).index, tierForIncome(settled).index)
  const currentTier = tierByIndex(currentTierIndex)

  // ---- peak + verified tiers over ALL history ----
  let peakIdx = 0
  let verifiedIdx = 0
  for (const [, v] of byMonth) {
    peakIdx = Math.max(peakIdx, tierForIncome(v.income).index)
    verifiedIdx = Math.max(verifiedIdx, tierForIncome(v.verified).index)
  }
  const peakTier = tierByIndex(peakIdx)
  const verifiedTier = tierByIndex(verifiedIdx)

  const next = nextTier(currentTier)
  const progress = tierProgress(Math.max(monthIncome, settled), currentTier)

  // ---- momentum: trailing 30d vs prior 30d (no month-boundary artifact) ----
  const t30 = sumWindow(income, now, 30, 0)
  const p30 = sumWindow(income, now, 60, 30)
  let momentum = p30 > 0 ? ((t30 - p30) / p30) * 100 : t30 > 0 ? 200 : 0
  momentum = Math.max(-100, Math.min(999, momentum))

  // ---- build continuous monthly series ----
  const keys = [...byMonth.keys()].sort()
  const firstKey = keys[0] ?? curKey
  const series: MonthPoint[] = []
  let k = firstKey
  const guard = 240
  let count = 0
  while (k <= curKey && count < guard) {
    const v = byMonth.get(k) ?? { income: 0, verified: 0, effort: 0 }
    series.push({
      key: k, label: monthLabel(k), income: v.income, verifiedIncome: v.verified,
      tierIndex: tierForIncome(v.income).index, effort: v.effort, isBreakthrough: false,
    })
    k = shiftMonth(k, 1)
    count++
  }
  const trimmed = series.slice(-SERIES_MONTHS)

  // ---- breakthroughs (非线性爆发) ----
  // A breakthrough is a month that's ≥2× your recent REAL earning baseline.
  // The first earning month has no baseline → it's a starting point, not a 爆发.
  const breakthroughs: Breakthrough[] = []
  for (let i = 0; i < trimmed.length; i++) {
    const cur = trimmed[i]
    if (cur.income < 10000) continue
    const priorReal = trimmed.slice(Math.max(0, i - 3), i).map((p) => p.income).filter((x) => x > 0)
    if (priorReal.length === 0) continue
    const baseline = Math.max(MONTH_FLOOR, median(priorReal))
    const multiple = cur.income / baseline
    if (multiple < 2) continue
    const prevTierMax = Math.max(0, ...trimmed.slice(Math.max(0, i - 2), i).map((p) => p.tierIndex))
    const tierJump = Math.max(0, cur.tierIndex - prevTierMax)
    cur.isBreakthrough = true
    breakthroughs.push({
      monthKey: cur.key, amount: cur.income, multiple: Math.round(multiple * 10) / 10, tierJump,
      label: `🔥 ${Math.round(multiple * 10) / 10}倍爆发`,
    })
  }

  // ---- streaks ----
  const dayset = new Set(entries.map((e) => startOfDay(new Date(e.occurredAt)).getTime()))
  let streakDays = 0
  let maxStreak = 0
  {
    // current streak (ending today or yesterday)
    let cursor = startOfDay(now).getTime()
    if (!dayset.has(cursor)) cursor -= 86400000
    while (dayset.has(cursor)) { streakDays++; cursor -= 86400000 }
    // max streak ever
    const sorted = [...dayset].sort((a, b) => a - b)
    let run = 0
    for (let i = 0; i < sorted.length; i++) {
      run = i > 0 && sorted[i] - sorted[i - 1] === 86400000 ? run + 1 : 1
      maxStreak = Math.max(maxStreak, run)
    }
  }
  let streakMonths = 0
  {
    let mk = byMonth.has(curKey) && (byMonth.get(curKey)!.income > 0) ? curKey : shiftMonth(curKey, -1)
    while ((byMonth.get(mk)?.income ?? 0) > 0) { streakMonths++; mk = shiftMonth(mk, -1) }
  }

  // ---- composition (last 90d) + diversification ----
  const comp = new Map<IncomeSourceId, number>()
  const income90 = sumWindow(income, now, 90, 0)
  for (const e of income) {
    if (now.getTime() - new Date(e.occurredAt).getTime() <= 90 * 86400000) {
      const s = (e.source ?? 'other') as IncomeSourceId
      comp.set(s, (comp.get(s) ?? 0) + (e.amount ?? 0))
    }
  }
  const composition = [...comp.entries()].map(([source, amount]) => ({ source, amount }))
    .sort((a, b) => b.amount - a.amount)
  const totalComp = composition.reduce((s, c) => s + c.amount, 0)
  const hhi = totalComp > 0 ? composition.reduce((s, c) => s + (c.amount / totalComp) ** 2, 0) : 1
  const diversification = totalComp > 0 ? Math.max(0, 1 - hhi) : 0

  // ---- hourly rate + weekly effort ----
  let hours90 = 0
  for (const e of entries) {
    const recent = now.getTime() - new Date(e.occurredAt).getTime() <= 90 * 86400000
    if (!recent) continue
    if (e.type === 'action' && e.effortUnit === 'hour') hours90 += e.effort ?? 0
    if (e.type === 'attempt') hours90 += e.investHours ?? 0
  }
  const hourlyRate = hours90 > 0 ? income90 / hours90 : undefined
  let effortWeek = 0
  for (const e of entries) {
    if (e.type === 'action' && now.getTime() - new Date(e.occurredAt).getTime() <= 7 * 86400000) {
      effortWeek += e.effort ?? 0
    }
  }

  // ---- XP / level ----
  const proofCount = entries.reduce((s, e) => s + (e.proofs?.length ?? 0), 0)
  const milestones = entries.filter((e) => e.type === 'milestone').length
  const xp = Math.round(
    entries.length * 10 + income.length * 5 + proofCount * 5 + attempts.length * 8 +
    milestones * 15 + aux.endorsementsGiven * 3 + aux.eventsAttended * 20 + maxStreak * 2,
  )
  const { level, xpInLevel, xpToNext } = levelFromXp(xp)

  // ---- integrity (诚信分) ----
  const totalIncomeAmt = income.reduce((s, e) => s + (e.amount ?? 0), 0)
  const verifiedAmt = income.reduce((s, e) => s + (isVerified(e) ? e.amount ?? 0 : 0), 0)
  const proofRatio = totalIncomeAmt > 0 ? verifiedAmt / totalIncomeAmt : 0
  const monthsActive = byMonth.size
  const integrity = totalIncomeAmt > 0
    ? Math.round(Math.max(0, Math.min(100, 40 + proofRatio * 40 + Math.min(15, aux.endorsementsReceived * 3) + Math.min(5, monthsActive))))
    : 60

  // ---- titles ----
  const sourcesEver = new Set(income.map((e) => e.source ?? 'other'))
  const monthsSinceJoin = (now.getTime() - new Date(profile.joinedAt).getTime()) / (30 * 86400000)
  const titles: string[] = []
  const add = (id: string, cond: boolean) => { if (cond) titles.push(id) }
  add('first_income', income.length >= 1)
  add('dawn', peakIdx >= 1)
  add('explorer', attempts.length >= 10)
  add('grinder', maxStreak >= 21)
  add('diversified', sourcesEver.size >= 4)
  add('breakout', breakthroughs.some((b) => b.multiple >= 3))
  add('comeback', breakthroughs.some((b) => b.tierJump >= 2))
  add('verified_pro', proofRatio >= 0.8 && income.length >= 3)
  add('team_player', aux.eventsAttended >= 1)
  add('mentor', aux.endorsementsGiven >= 10)
  add('longterm', monthsSinceJoin >= 12)
  add('windmaker', peakIdx >= 6)

  const goal = profile.goalMonthly
  return {
    monthIncome, verifiedMonthIncome, monthGoal: goal,
    goalProgress: goal ? Math.max(0, Math.min(1, monthIncome / goal)) : 0,
    currentTier, peakTier, verifiedTier, nextTier: next, tierProgress: progress,
    momentum, breakthroughs: breakthroughs.reverse(), streakDays, streakMonths,
    level, xp, xpInLevel, xpToNext, integrity,
    totalIncome: totalIncomeAmt, activeVentures: attempts.filter((a) => a.status === 'active' || a.status === 'working').length,
    monthlySeries: trimmed, composition, diversification, hourlyRate, effortWeek, titles,
  }
}

/** Lightweight snapshot for leaderboards — avoids recomputing full stats for every rival. */
export function snapshotProfile(p: Profile): Profile {
  return p
}
