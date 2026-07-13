import type { MonthPoint } from '../types'
import { TIERS } from '../lib/tiers'
import { wan } from '../lib/format'

/** The wealth curve — deliberately jagged, with 爆发 (breakthrough) markers.
 *  Never a smooth idealized line: shows the real non-linear reality. */
export function WealthCurve({ series, height = 190 }: { series: MonthPoint[]; height?: number }) {
  const W = 340
  const H = height
  const padX = 14
  const padTop = 22
  const padBot = 26
  if (series.length === 0) {
    return <div className="text-sm text-faint text-center py-10">还没有数据，去记录一笔收入吧</div>
  }
  const max = Math.max(10000, ...series.map((s) => s.income))
  const n = series.length
  const x = (i: number) => padX + (n === 1 ? (W - 2 * padX) / 2 : (i / (n - 1)) * (W - 2 * padX))
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBot)

  const linePts = series.map((s, i) => `${x(i)},${y(s.income)}`).join(' ')
  const areaPts = `${x(0)},${H - padBot} ${linePts} ${x(n - 1)},${H - padBot}`

  // tier threshold guide lines within range
  const guides = TIERS.filter((t) => t.threshold > 0 && t.threshold <= max)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="wc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0.28" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {guides.map((t) => (
        <g key={t.id}>
          <line x1={padX} y1={y(t.threshold)} x2={W - padX} y2={y(t.threshold)} stroke={t.color} strokeOpacity="0.28" strokeWidth="1" strokeDasharray="3 4" />
          <text x={W - padX} y={y(t.threshold) - 3} textAnchor="end" fontSize="8" fill={t.color} fillOpacity="0.8">{t.emoji}{wan(t.threshold, false)}</text>
        </g>
      ))}
      <polygon points={areaPts} fill="url(#wc-fill)" />
      <polyline points={linePts} fill="none" stroke="rgb(var(--accent))" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((s, i) => (
        s.isBreakthrough ? (
          <g key={s.key}>
            <circle cx={x(i)} cy={y(s.income)} r="6.5" fill="#f5c542" opacity="0.25" />
            <circle cx={x(i)} cy={y(s.income)} r="3.6" fill="#f5c542" stroke="#fff3c4" strokeWidth="1" />
            <text x={x(i)} y={y(s.income) - 10} textAnchor="middle" fontSize="9">🔥</text>
          </g>
        ) : (
          <circle key={s.key} cx={x(i)} cy={y(s.income)} r="2.2" fill="rgb(var(--accent))" />
        )
      ))}
      {series.map((s, i) => (
        (i === 0 || i === n - 1 || i % Math.ceil(n / 6) === 0) && (
          <text key={'l' + s.key} x={x(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="rgb(var(--faint))">{s.label}</text>
        )
      ))}
    </svg>
  )
}

export function Donut({ segments, size = 128, thickness = 18, center }: { segments: { value: number; color: string; label?: string }[]; size?: number; thickness?: number; center?: React.ReactNode }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--subtle))" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const frac = s.value / total
          const dash = frac * c
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} opacity="0.9" />
          )
          offset += dash
          return el
        })}
      </svg>
      {center && <div className="absolute inset-0 flex items-center justify-center">{center}</div>}
    </div>
  )
}

export function Bars({ data, height = 90 }: { data: { label: string; value: number; color?: string; highlight?: boolean }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full rounded-t-md origin-bottom" style={{
            height: `${(d.value / max) * (height - 18)}px`,
            background: d.color ?? (d.highlight ? '#f5c542' : 'rgb(var(--accent))'),
            opacity: d.value === 0 ? 0.25 : 1,
            animation: 'risebar 0.6s cubic-bezier(0.22,1,0.36,1) both',
            animationDelay: `${i * 30}ms`,
          }} />
          <div className="text-[0.6rem] text-faint truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

export function Sparkline({ points, width = 72, height = 26, up }: { points: number[]; width?: number; height?: number; up?: boolean }) {
  if (points.length < 2) return <div style={{ width, height }} />
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const isUp = up ?? points[points.length - 1] >= points[0]
  const pts = points.map((p, i) => `${(i / (points.length - 1)) * width},${height - ((p - min) / span) * height}`).join(' ')
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={isUp ? 'rgb(var(--gain))' : 'rgb(var(--loss))'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
