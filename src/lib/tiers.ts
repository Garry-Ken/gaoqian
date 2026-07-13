import type { TierDef } from '../types'

// The ladder anchors on the thresholds the product is built around:
// 月赚 1w / 3w / 5w / 10w / 30w / 100w — plus a 萌新 starting tier.
// Rank labels borrow the familiar 王者荣耀-style metaphor so the climb reads instantly.
export const TIERS: TierDef[] = [
  {
    id: 't0', name: '萌新', index: 0, threshold: 0, rankLabel: '起步', emoji: '🌱',
    subtitle: '刚上路 · 先记下第一笔', color: '#8e8e93', gradient: ['#a1a1aa', '#6b6b76'], glow: 'rgba(142,142,147,0.35)',
  },
  {
    id: 't1', name: '破晓', index: 1, threshold: 10000, rankLabel: '青铜', emoji: '🌅',
    subtitle: '月入 1 万俱乐部', color: '#d08a4e', gradient: ['#e8a86a', '#b06f2e'], glow: 'rgba(208,138,78,0.45)',
  },
  {
    id: 't2', name: '起势', index: 2, threshold: 30000, rankLabel: '白银', emoji: '🌊',
    subtitle: '月入 3 万 · 势头起来了', color: '#aeb6c2', gradient: ['#d3dae4', '#9aa4b2'], glow: 'rgba(174,182,194,0.5)',
  },
  {
    id: 't3', name: '破局', index: 3, threshold: 50000, rankLabel: '黄金', emoji: '🔓',
    subtitle: '月入 5 万 · 打开局面', color: '#e6b23e', gradient: ['#f7d774', '#e0a92e'], glow: 'rgba(230,178,62,0.5)',
  },
  {
    id: 't4', name: '操盘', index: 4, threshold: 100000, rankLabel: '铂金', emoji: '🎯',
    subtitle: '月入 10 万 · 独立操盘', color: '#37c9ba', gradient: ['#6fe9da', '#22b8a6'], glow: 'rgba(55,201,186,0.5)',
  },
  {
    id: 't5', name: '势成', index: 5, threshold: 300000, rankLabel: '钻石', emoji: '💠',
    subtitle: '月入 30 万 · 势已成', color: '#5a9dff', gradient: ['#7db8ff', '#3d7fe0'], glow: 'rgba(90,157,255,0.55)',
  },
  {
    id: 't6', name: '造风', index: 6, threshold: 1000000, rankLabel: '王者', emoji: '👑',
    subtitle: '月入 100 万 · 造风者', color: '#c77dff', gradient: ['#c77dff', '#f5c542'], glow: 'rgba(199,125,255,0.6)',
  },
]

export const MAX_TIER = TIERS[TIERS.length - 1]

export function tierByIndex(i: number): TierDef {
  return TIERS[Math.max(0, Math.min(TIERS.length - 1, i))]
}
export function tierById(id: string): TierDef {
  return TIERS.find((t) => t.id === id) ?? TIERS[0]
}

/** Highest tier whose monthly threshold is met by `monthly` (¥). */
export function tierForIncome(monthly: number): TierDef {
  let t = TIERS[0]
  for (const tier of TIERS) if (monthly >= tier.threshold) t = tier
  return t
}

export function nextTier(t: TierDef): TierDef | undefined {
  return TIERS[t.index + 1]
}

/** Progress 0..1 from current tier threshold toward the next (linear). */
export function tierProgress(monthly: number, t: TierDef): number {
  const next = nextTier(t)
  if (!next) return 1
  const span = next.threshold - t.threshold
  if (span <= 0) return 1
  return Math.max(0, Math.min(1, (monthly - t.threshold) / span))
}
