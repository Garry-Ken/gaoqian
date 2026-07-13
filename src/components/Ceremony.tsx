import { useEffect } from 'react'
import type { TierDef } from '../types'
import { burst, Button } from './ui'

export interface CeremonyPayload {
  kind: 'rankup' | 'breakthrough'
  tier?: TierDef
  title: string
  sub: string
}

export function Ceremony({ payload, onClose, onShare }: { payload: CeremonyPayload; onClose: () => void; onShare?: () => void }) {
  useEffect(() => {
    burst(payload.kind === 'rankup' ? 'confetti' : 'coins')
    const t = setTimeout(() => burst(payload.kind === 'rankup' ? 'confetti' : 'coins'), 350)
    return () => clearTimeout(t)
  }, [payload])

  const tier = payload.tier
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-8 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="absolute inset-0 opacity-40"
        style={{ background: tier ? `radial-gradient(circle at 50% 42%, ${tier.glow}, transparent 60%)` : 'radial-gradient(circle at 50% 42%, rgba(245,197,66,0.35), transparent 60%)' }}
      />
      <div className="relative flex flex-col items-center text-center gap-5 animate-pop" onClick={(e) => e.stopPropagation()}>
        <div className="text-eyebrow tracking-[0.3em] text-white/70 uppercase">
          {payload.kind === 'rankup' ? 'RANK UP · 升段' : 'BREAKTHROUGH · 爆发'}
        </div>
        {tier ? (
          <div
            className="w-40 h-40 rounded-[2.5rem] flex items-center justify-center text-7xl animate-float"
            style={{ background: `linear-gradient(135deg, ${tier.gradient[0]}, ${tier.gradient[1]})`, boxShadow: `0 20px 80px ${tier.glow}` }}
          >
            {tier.emoji}
          </div>
        ) : (
          <div className="text-8xl animate-float">🔥</div>
        )}
        <div>
          <div className="text-3xl font-bold text-white foil">{payload.title}</div>
          <div className="text-white/70 mt-2 max-w-xs">{payload.sub}</div>
        </div>
        <div className="flex gap-3 mt-2">
          {onShare && <Button variant="gold" onClick={onShare} className="px-6">📸 晒战报</Button>}
          <Button variant={onShare ? 'ghost' : 'gold'} onClick={onClose} className="px-6">继续搞钱 →</Button>
        </div>
      </div>
    </div>
  )
}
