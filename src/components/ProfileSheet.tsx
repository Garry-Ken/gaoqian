import { useState } from 'react'
import { useStore } from '../store'
import { tierById } from '../lib/tiers'
import { titleMeta } from '../lib/catalog'
import { wan, pct } from '../lib/format'
import { Sheet, Avatar, TierBadge, Pill, Button, cx } from './ui'
import { IconShield, IconBolt, IconFlame, IconCheck } from './icons'

export function ProfileSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const { getProfile, me, teams, endorsements, endorse } = useStore()
  const p = getProfile(id)
  const [done, setDone] = useState(false)
  if (!p) return null
  const isMe = me?.id === p.id
  const cur = tierById(p.snapCurrentTier ?? 't0')
  const peak = tierById(p.snapPeakTier ?? 't0')
  const verified = tierById(p.snapVerifiedTier ?? 't0')
  const team = teams.find((t) => t.id === p.teamId)
  const received = endorsements.filter((e) => e.toId === p.id).length + (done ? 1 : 0)
  const alreadyEndorsed = !!me && endorsements.some((e) => e.fromId === me.id && e.toId === p.id)

  return (
    <Sheet open onClose={onClose} title="玩家资料">
      <div className="flex items-center gap-4">
        <Avatar emoji={p.avatar} size={64} ring={cur.color} />
        <div className="min-w-0">
          <div className="text-xl font-bold flex items-center gap-2">{p.name} {isMe && <Pill tone="accent">我</Pill>}</div>
          <div className="text-sm text-muted">{p.city ?? '未知城市'}{team && ` · ${team.emoji}${team.name}`}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <div className="flex items-center gap-1.5"><span className="text-xs text-muted">当前</span><TierBadge tier={cur} size="sm" /></div>
        {peak.index > cur.index && <div className="flex items-center gap-1.5"><span className="text-xs text-muted">巅峰</span><TierBadge tier={peak} size="sm" /></div>}
        <div className="flex items-center gap-1.5"><span className="text-xs text-muted">认证</span><TierBadge tier={verified} size="sm" /></div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        <Stat label="本月" value={wan(p.snapMonthIncome ?? 0)} />
        <Stat label="势能" value={pct(p.snapMomentum ?? 0)} icon={<IconBolt />} tone={(p.snapMomentum ?? 0) >= 0 ? 'gain' : 'loss'} />
        <Stat label="诚信" value={String(p.snapIntegrity ?? 60)} icon={<IconShield />} />
        <Stat label="等级" value={`Lv.${p.snapLevel ?? 1}`} />
        <Stat label="连续月" value={`${p.snapStreakMonths ?? 0}月`} icon={<IconFlame />} />
        <Stat label="被背书" value={`${received}人`} />
      </div>

      {(p.snapTitles?.length ?? 0) > 0 && (
        <div className="mt-4">
          <div className="text-xs text-muted mb-1.5">称号</div>
          <div className="flex flex-wrap gap-2">
            {p.snapTitles!.map((tid) => { const m = titleMeta(tid); return m ? <span key={tid} className="pill bg-subtle">{m.emoji} {m.name}</span> : null })}
          </div>
        </div>
      )}

      {!isMe && me && (
        <Button variant={alreadyEndorsed || done ? 'ghost' : 'gold'} className="w-full mt-6"
          disabled={alreadyEndorsed || done}
          onClick={() => { endorse(p.id, '线下见过，真实'); setDone(true) }}>
          {alreadyEndorsed || done ? <><IconCheck /> 已为TA背书</> : '🫱 为TA的真实性背书'}
        </Button>
      )}
    </Sheet>
  )
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon?: React.ReactNode; tone?: 'gain' | 'loss' }) {
  return (
    <div className="card p-2.5 flex flex-col items-center gap-0.5">
      <span className={cx('num text-base font-bold flex items-center gap-1', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{icon}{value}</span>
      <span className="text-[0.62rem] text-faint">{label}</span>
    </div>
  )
}
