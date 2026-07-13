import { useStore } from '../store'
import { wan, yuan, pct, relativeTime } from '../lib/format'
import { nextTier } from '../lib/tiers'
import { useCountUp, Bar, Pill, Avatar, cx } from '../components/ui'
import { IconFlame, IconBolt, IconShield, IconTrend, IconPlus, IconChevron } from '../components/icons'

export function Home({ onQuickLog, onOpenProfile, onShare, goTab }: { onQuickLog: () => void; onOpenProfile: (id: string) => void; onShare: () => void; goTab: (t: string) => void }) {
  const { stats, meRow, feed, getProfile, now } = useStore()
  const income = useCountUp(stats?.monthIncome ?? 0)
  if (!stats || !meRow) return null
  const t = stats.currentTier
  const nt = nextTier(t)

  const highlights = feed.filter((f) => f.kind === 'breakthrough' || f.kind === 'rankup' || f.kind === 'income')
    .sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5)

  return (
    <div className="space-y-4 pb-4">
      {/* hero 段位 card */}
      <div className="relative overflow-hidden rounded-4xl p-5 card" style={{ background: `linear-gradient(160deg, ${t.gradient[0]}22, ${t.gradient[1]}0a 60%), rgb(var(--surface))` }}>
        <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full blur-2xl opacity-40" style={{ background: t.glow }} />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-eyebrow uppercase tracking-widest text-muted">当前段位</div>
            <div className="flex items-center gap-1.5">
              {stats.peakTier.index > t.index && <Pill tone="gold">巅峰 {stats.peakTier.name}</Pill>}
              <Pill tone={stats.momentum >= 0 ? 'gain' : 'loss'}><IconBolt /> {pct(stats.momentum)}</Pill>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="w-[72px] h-[72px] rounded-3xl flex items-center justify-center text-4xl shrink-0 animate-float"
              style={{ background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[1]})`, boxShadow: `0 10px 30px ${t.glow}` }}>
              {t.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold leading-tight">{t.name} <span className="text-sm font-medium text-muted">{t.rankLabel}</span></div>
              <div className="text-xs text-muted">{t.subtitle}</div>
            </div>
          </div>

          {/* progress to next tier */}
          <div className="mt-4">
            {nt ? (
              <>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted">冲 <span className="text-fg font-semibold">{nt.name}</span>（月入 {wan(nt.threshold, false)}）</span>
                  <span className="num text-muted">{Math.round(stats.tierProgress * 100)}%</span>
                </div>
                <Bar value={stats.tierProgress} tint={`linear-gradient(90deg, ${t.gradient[0]}, ${nt.gradient[0]})`} height={9} />
              </>
            ) : (
              <div className="text-center text-sm foil font-bold py-1">👑 已达顶级段位 · 造风者</div>
            )}
          </div>
        </div>
      </div>

      {/* month income vs goal */}
      <div className="card p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-muted">本月已进账</div>
            <div className="num text-4xl font-bold mt-0.5">{yuan(income)}</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button onClick={onShare} className="pill bg-gold/15 text-gold tap">📸 晒战报</button>
            {stats.verifiedMonthIncome > 0 && (
              <Pill tone="accent"><IconShield /> 已验证 {wan(stats.verifiedMonthIncome)}</Pill>
            )}
          </div>
        </div>
        {meRow.goalMonthly ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted">本月目标 {wan(meRow.goalMonthly, false)}</span>
              <span className="num font-semibold" style={{ color: stats.goalProgress >= 1 ? 'rgb(var(--gain))' : undefined }}>{Math.round(stats.goalProgress * 100)}%</span>
            </div>
            <Bar value={stats.goalProgress} tint={stats.goalProgress >= 1 ? 'rgb(var(--gain))' : 'rgb(var(--accent))'} height={9} />
          </div>
        ) : null}
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-4 gap-2.5">
        <MiniStat icon={<IconBolt />} label="势能" value={pct(stats.momentum)} tone={stats.momentum >= 0 ? 'gain' : 'loss'} />
        <MiniStat icon={<IconFlame />} label="连续" value={`${stats.streakDays}天`} />
        <MiniStat icon={<IconTrend />} label="工作量" value={String(stats.effortWeek)} />
        <MiniStat icon={<IconShield />} label="诚信" value={String(stats.integrity)} />
      </div>

      {/* breakthroughs */}
      {stats.breakthroughs.length > 0 && (
        <div className="card p-4">
          <div className="text-sm font-bold flex items-center gap-1.5 mb-2">🔥 你的爆发时刻</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {stats.breakthroughs.slice(0, 6).map((b) => (
              <div key={b.monthKey} className="shrink-0 rounded-2xl px-3 py-2 bg-gold/10 border border-gold/20">
                <div className="text-xs text-gold font-semibold">{b.label}</div>
                <div className="num text-sm font-bold mt-0.5">{wan(b.amount)}</div>
                <div className="text-[0.65rem] text-faint">{b.monthKey}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* quick log CTA */}
      <button onClick={onQuickLog} className="card card-tap w-full p-4 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-2xl bg-accent/15 text-accent flex items-center justify-center text-xl"><IconPlus /></div>
        <div className="flex-1">
          <div className="font-semibold text-sm">记一笔</div>
          <div className="text-xs text-muted">收入 · 尝试 · 工作量 · 里程碑</div>
        </div>
        <IconChevron className="text-faint" />
      </button>

      {/* live feed */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm font-bold">江湖动态</div>
        <button onClick={() => goTab('arena')} className="text-xs text-accent flex items-center">全部 <IconChevron /></button>
      </div>
      <div className="space-y-2">
        {highlights.map((f) => {
          const actor = getProfile(f.actorId)
          if (!actor) return null
          return (
            <button key={f.id} onClick={() => onOpenProfile(actor.id)} className="card card-tap w-full p-3 flex items-center gap-3 text-left">
              <Avatar emoji={actor.avatar} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{actor.name}</div>
                <div className="text-xs text-muted truncate">{f.text}</div>
              </div>
              <div className="text-right shrink-0">
                {f.amount ? <div className="num text-sm font-bold text-gain">{wan(f.amount)}</div> : f.kind === 'rankup' ? <span className="text-lg">⬆️</span> : <span className="text-lg">🔥</span>}
                <div className="text-[0.6rem] text-faint">{relativeTime(f.at, now)}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="card p-2.5 flex flex-col items-center gap-0.5">
      <span className={cx('text-base', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{icon}</span>
      <span className={cx('num text-sm font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{value}</span>
      <span className="text-[0.62rem] text-faint">{label}</span>
    </div>
  )
}
