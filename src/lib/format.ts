// Money + time formatting. Chinese wealth apps read large sums in 万/亿.

export function yuan(n: number, sign = false): string {
  const s = sign && n > 0 ? '+' : ''
  return s + '¥' + Math.round(n).toLocaleString('en-US')
}

/** Compact ¥ for cards/leaderboards: 8,500 / 12.5万 / 3.2亿 */
export function wan(n: number, withSymbol = true): string {
  const sym = withSymbol ? '¥' : ''
  const abs = Math.abs(n)
  const sgn = n < 0 ? '-' : ''
  if (abs >= 1e8) return `${sgn}${sym}${trim(abs / 1e8)}亿`
  if (abs >= 1e4) return `${sgn}${sym}${trim(abs / 1e4)}万`
  return `${sgn}${sym}${Math.round(abs).toLocaleString('en-US')}`
}

function trim(x: number): string {
  const r = x >= 100 ? Math.round(x) : Math.round(x * 100) / 100
  return String(r)
}

export function pct(n: number, withSign = true): string {
  const s = withSign && n > 0 ? '+' : ''
  return `${s}${Math.round(n)}%`
}

export function monthKey(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key: string): string {
  const [, m] = key.split('-')
  return `${Number(m)}月`
}

export function monthLabelFull(key: string): string {
  const [y, m] = key.split('-')
  return `${y}年${Number(m)}月`
}

/** Shift a YYYY-MM key by n months. */
export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return monthKey(d)
}

export function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(startOfDay(a).getTime() - startOfDay(b).getTime())
  return Math.round(ms / 86400000)
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function relativeTime(iso: string, now: Date): string {
  const then = new Date(iso)
  const s = Math.floor((now.getTime() - then.getTime()) / 1000)
  if (s < 60) return '刚刚'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo} 个月前`
  return `${Math.floor(mo / 12)} 年前`
}

export function dateLabel(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function todayISO(): string {
  return new Date().toISOString()
}

/** value formatter for a custom metric by kind */
export function metricValue(v: number, kind: string, unit: string): string {
  if (kind === 'currency') return wan(v)
  if (kind === 'percent') return `${trim(v)}%`
  const base = Math.abs(v) >= 1e4 ? wan(v, false) : v.toLocaleString('en-US')
  return unit ? `${base} ${unit}` : base
}
