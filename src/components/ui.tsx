import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import type { TierDef } from '../types'
import { IconClose } from './icons'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

/** Animated count-up for money / stats. Respects reduced-motion. */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(target)
  const from = useRef(target)
  const raf = useRef(0)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setVal(target); return }
    const start = performance.now()
    const a = from.current
    const b = target
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      setVal(a + (b - a) * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else from.current = b
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return val
}

export function Avatar({ emoji, size = 40, ring }: { emoji: string; size?: number; ring?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-full bg-subtle shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.52, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
    >
      {emoji}
    </div>
  )
}

export function TierBadge({ tier, size = 'md' }: { tier: TierDef; size?: 'sm' | 'md' | 'lg' }) {
  const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : size === 'sm' ? 'px-2 py-0.5 text-[0.68rem]' : 'px-2.5 py-1 text-xs'
  return (
    <span
      className={cx('inline-flex items-center gap-1 rounded-full font-semibold', pad)}
      style={{ background: `linear-gradient(135deg, ${tier.gradient[0]}, ${tier.gradient[1]})`, color: tier.index >= 2 && tier.index !== 6 ? '#1a1200' : '#fff' }}
    >
      <span>{tier.emoji}</span>
      <span>{tier.name}</span>
    </span>
  )
}

export function Pill({ children, tone = 'default', className }: { children: ReactNode; tone?: 'default' | 'gain' | 'loss' | 'gold' | 'accent'; className?: string }) {
  const tones: Record<string, string> = {
    default: 'bg-subtle text-muted',
    gain: 'bg-gain/15 text-gain',
    loss: 'bg-loss/15 text-loss',
    gold: 'bg-gold/15 text-gold',
    accent: 'bg-accent/15 text-accent',
  }
  return <span className={cx('pill', tones[tone], className)}>{children}</span>
}

export function Bar({ value, tint = 'rgb(var(--accent))', track, height = 8 }: { value: number; tint?: string; track?: string; height?: number }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: track ?? 'rgb(var(--subtle))' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-spring" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: tint }} />
    </div>
  )
}

export function Ring({ value, size = 64, stroke = 6, tint = 'rgb(var(--accent))', children }: { value: number; size?: number; stroke?: number; tint?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--subtle))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tint} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}

export function StatTile({ label, value, sub, tone, icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'gain' | 'loss'; icon?: ReactNode }) {
  return (
    <div className="card p-3.5 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted text-xs">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </div>
      <div className={cx('num text-xl font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{value}</div>
      {sub != null && <div className="text-xs text-faint">{sub}</div>}
    </div>
  )
}

export function Segmented<T extends string>({ options, value, onChange, className }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cx('seg no-scrollbar overflow-x-auto', className)}>
      {options.map((o) => (
        <button key={o.id} className={cx('seg-item', value === o.id && 'seg-item-active')} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Button({ children, onClick, variant = 'primary', className, disabled, style, type }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'gold' | 'ghost' | 'line'; className?: string; disabled?: boolean; style?: CSSProperties; type?: 'button' | 'submit' }) {
  const v = { primary: 'btn-primary', gold: 'btn-gold', ghost: 'btn-ghost', line: 'btn-line' }[variant]
  return (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled} style={style} className={cx('btn px-5 py-3', v, className)}>{children}</button>
  )
}

/** iOS-style bottom sheet. */
export function Sheet({ open, onClose, title, children, maxH = '88vh' }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; maxH?: string }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md glass border-t hairline rounded-t-4xl animate-slide-up safe-bottom overflow-y-auto no-scrollbar"
        style={{ maxHeight: maxH }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 glass flex items-center justify-between px-5 pt-4 pb-3">
          <div className="text-base font-bold">{title}</div>
          <button className="tap w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-muted" onClick={onClose}><IconClose /></button>
        </div>
        <div className="mx-auto -mt-1 mb-1 h-1 w-10 rounded-full bg-white/20" />
        <div className="px-5 pb-8 pt-1">{children}</div>
      </div>
    </div>
  )
}

/** Confetti / coin burst for ceremonies. */
export function burst(kind: 'confetti' | 'coins' = 'confetti') {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return
  const layer = document.createElement('div')
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:80;overflow:hidden'
  document.body.appendChild(layer)
  const colors = kind === 'coins' ? ['#f7d774', '#e0a92e', '#fff3c4'] : ['#0a84ff', '#30d158', '#f5c542', '#ff375f', '#bf5af2', '#34d9c9']
  const N = 46
  for (let i = 0; i < N; i++) {
    const el = document.createElement('div')
    const size = 6 + Math.random() * 8
    el.textContent = kind === 'coins' ? '🪙' : ''
    el.style.cssText = `position:absolute;left:${50 + (Math.random() * 30 - 15)}%;top:35%;width:${size}px;height:${size}px;${kind === 'coins' ? `font-size:${size + 8}px;` : `background:${colors[i % colors.length]};border-radius:2px;`}will-change:transform,opacity`
    layer.appendChild(el)
    const dx = (Math.random() * 2 - 1) * 260
    const dy = 200 + Math.random() * 380
    const rot = Math.random() * 720 - 360
    el.animate(
      [
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(0.22,1,0.36,1)', fill: 'forwards' },
    )
  }
  setTimeout(() => layer.remove(), 2100)
}

export function EmptyState({ emoji, title, sub, action }: { emoji: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-8 gap-2">
      <div className="text-5xl mb-1 animate-float">{emoji}</div>
      <div className="font-bold">{title}</div>
      {sub && <div className="text-sm text-muted max-w-xs">{sub}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
