import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { TITLES, INCOME_SOURCES, sourceMeta } from '../lib/catalog'
import { nextTier } from '../lib/tiers'
import { wan, pct } from '../lib/format'
import { WealthCurve, Donut } from '../components/charts'
import { Avatar, TierBadge, Bar, Ring, Button, Segmented, Sheet, cx } from '../components/ui'
import { IconShield, IconBolt, IconTrend, IconGear, IconCheck } from '../components/icons'
import { AuthSheet } from '../components/AuthSheet'

export function Me({ onOpenProfile, onShare }: { onOpenProfile: (id: string) => void; onShare: () => void }) {
  void onOpenProfile
  const store = useStore()
  const { me, meRow, stats, endorsements } = store
  const [view, setView] = useState<'analysis' | 'titles'>('analysis')
  const [settings, setSettings] = useState(false)
  const [auth, setAuth] = useState(false)
  const suggestions = useMemo(() => (stats ? buildSuggestions(stats) : []), [stats])
  if (!me || !meRow || !stats) return null

  const received = endorsements.filter((e) => e.toId === me.id).length

  return (
    <div className="space-y-4 pb-4">
      {/* profile header */}
      <div className="card p-5">
        <div className="flex items-center gap-4">
          <Avatar emoji={me.avatar} size={64} ring={stats.currentTier.color} />
          <div className="flex-1 min-w-0">
            <div className="text-xl font-bold truncate">{me.name}</div>
            <div className="text-sm text-muted">{me.city ?? '未设置城市'} · 入局 {Math.max(1, Math.round((store.now.getTime() - +new Date(me.joinedAt)) / 86400000))} 天</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onShare} aria-label="晒战报" className="tap w-9 h-9 rounded-full btn-gold flex items-center justify-center text-base">📸</button>
            <button onClick={() => setSettings(true)} className="tap w-9 h-9 rounded-full bg-subtle flex items-center justify-center text-muted"><IconGear /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-1.5"><span className="text-xs text-muted">当前</span><TierBadge tier={stats.currentTier} size="sm" /></div>
          {stats.peakTier.index > stats.currentTier.index && <div className="flex items-center gap-1.5"><span className="text-xs text-muted">巅峰</span><TierBadge tier={stats.peakTier} size="sm" /></div>}
          <div className="flex items-center gap-1.5"><span className="text-xs text-muted">认证</span><TierBadge tier={stats.verifiedTier} size="sm" /></div>
        </div>

        {/* level + integrity */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t hairline">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1"><span className="text-muted">Lv.{stats.level}</span><span className="num text-faint">{stats.xpInLevel}/{stats.xpInLevel + stats.xpToNext} XP</span></div>
            <Bar value={stats.xpInLevel / (stats.xpInLevel + stats.xpToNext)} tint="linear-gradient(90deg,#0a84ff,#34d9c9)" />
          </div>
          <Ring value={stats.integrity / 100} size={54} stroke={5} tint="rgb(var(--gain))">
            <div className="text-center"><div className="num text-sm font-bold leading-none">{stats.integrity}</div><div className="text-[0.5rem] text-faint">诚信</div></div>
          </Ring>
        </div>
      </div>

      <Segmented options={[{ id: 'analysis', label: '财富路径' }, { id: 'titles', label: '称号成就' }]} value={view} onChange={setView} />

      {view === 'analysis' && (
        <>
          {/* wealth curve */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm font-bold flex items-center gap-1.5"><IconTrend /> 财富曲线</div>
              <div className="text-xs text-faint">真实非线性 · 🔥=爆发月</div>
            </div>
            <WealthCurve series={stats.monthlySeries} />
            <div className="grid grid-cols-3 gap-2 mt-2 text-center">
              <MiniKPI label="累计收入" value={wan(stats.totalIncome)} />
              <MiniKPI label="本月势能" value={pct(stats.momentum)} tone={stats.momentum >= 0 ? 'gain' : 'loss'} />
              <MiniKPI label="爆发次数" value={`${stats.breakthroughs.length}次`} />
            </div>
          </div>

          {/* composition */}
          <div className="card p-4">
            <div className="text-sm font-bold mb-3">收入结构 <span className="text-xs text-muted font-normal">近90天</span></div>
            {stats.composition.length > 0 ? (
              <div className="flex items-center gap-4">
                <Donut segments={stats.composition.map((c) => ({ value: c.amount, color: sourceMeta(c.source).color }))} size={120} center={
                  <div className="text-center"><div className="num text-sm font-bold">{Math.round(stats.diversification * 100)}</div><div className="text-[0.55rem] text-faint">多元度</div></div>
                } />
                <div className="flex-1 space-y-1.5">
                  {stats.composition.slice(0, 5).map((c) => {
                    const m = sourceMeta(c.source)
                    const share = c.amount / stats.composition.reduce((s, x) => s + x.amount, 0)
                    return (
                      <div key={c.source} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                        <span className="flex-1 text-muted">{m.emoji} {m.label}</span>
                        <span className="num font-semibold">{Math.round(share * 100)}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : <div className="text-sm text-faint text-center py-6">记录带来源的收入后，这里会分析你的结构</div>}
          </div>

          {/* structure kpis */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="card p-3.5"><div className="text-xs text-muted flex items-center gap-1"><IconShield />认证占比</div><div className="num text-xl font-bold mt-1">{stats.monthIncome > 0 ? Math.round(stats.verifiedMonthIncome / stats.monthIncome * 100) : 0}%</div><div className="text-xs text-faint">本月带凭证收入</div></div>
            <div className="card p-3.5"><div className="text-xs text-muted flex items-center gap-1"><IconBolt />时薪</div><div className="num text-xl font-bold mt-1">{stats.hourlyRate ? wan(stats.hourlyRate) : '—'}</div><div className="text-xs text-faint">近90天 收入/投入</div></div>
          </div>

          {/* suggestions */}
          <div className="card p-4">
            <div className="text-sm font-bold mb-2">🧭 下一步建议</div>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-muted flex-1">{s.text}</span>
                </div>
              ))}
            </div>
          </div>

          {received > 0 && <div className="text-center text-xs text-faint">🫱 {received} 位搞钱人为你的真实性背书</div>}
        </>
      )}

      {view === 'titles' && (
        <div className="grid grid-cols-2 gap-2.5">
          {TITLES.map((t) => {
            const earned = stats.titles.includes(t.id)
            return (
              <div key={t.id} className={cx('card p-4 flex flex-col gap-1', !earned && 'opacity-45')}>
                <div className="flex items-center justify-between"><span className="text-3xl">{t.emoji}</span>{earned && <IconCheck className="text-gain" />}</div>
                <div className="font-bold text-sm mt-1">{t.name}</div>
                <div className="text-xs text-muted">{t.desc}</div>
              </div>
            )
          })}
        </div>
      )}

      {settings && <SettingsSheet onClose={() => setSettings(false)} onAuth={() => { setSettings(false); setAuth(true) }} />}
      {auth && <AuthSheet onClose={() => setAuth(false)} />}
    </div>
  )
}

function MiniKPI({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return <div><div className={cx('num text-base font-bold', tone === 'gain' && 'text-gain', tone === 'loss' && 'text-loss')}>{value}</div><div className="text-[0.62rem] text-faint">{label}</div></div>
}

function buildSuggestions(stats: import('../types').PlayerStats): { emoji: string; text: string }[] {
  const out: { emoji: string; text: string }[] = []
  const nt = nextTier(stats.currentTier)
  if (nt) {
    const gap = Math.max(0, nt.threshold - stats.monthIncome)
    out.push({ emoji: '🎯', text: `距离「${nt.name}」还差 ${wan(gap)}/月。稳定住这个月的进账，你就上去了。` })
  }
  if (stats.composition.length <= 1 && stats.monthIncome > 0) {
    out.push({ emoji: '🌱', text: '收入几乎全来自单一来源，抗风险能力弱。试着开第二条线（记一个新副本）。' })
  } else if (stats.diversification > 0.6) {
    out.push({ emoji: '🛡️', text: `收入结构很多元（多元度 ${Math.round(stats.diversification * 100)}），继续保持，这是穿越周期的底气。` })
  }
  if (stats.monthIncome > 0 && stats.verifiedMonthIncome / stats.monthIncome < 0.4) {
    out.push({ emoji: '📸', text: '大部分收入还没凭证。补上截图能上「真实榜」，诚信分也会涨。' })
  }
  if (stats.momentum < 0) {
    out.push({ emoji: '🔁', text: '这个月势能回落了。回看上个月做对的动作，把它变成可复制的系统。' })
  } else if (stats.momentum > 100) {
    out.push({ emoji: '🚀', text: `势能 ${pct(stats.momentum)}，正在爆发期！趁热加码，别停。` })
  }
  if (stats.streakDays < 3) {
    out.push({ emoji: '🧘', text: '连续记录会累积「苦行僧」称号，也让复盘更准。今天先记一条。' })
  }
  if (stats.activeVentures === 0) {
    out.push({ emoji: '🧪', text: '当前没有进行中的尝试。搞钱是概率游戏——多开几个副本，等一次爆发。' })
  }
  return out.slice(0, 4)
}

function SettingsSheet({ onClose, onAuth }: { onClose: () => void; onAuth: () => void }) {
  const store = useStore()
  function exportData() {
    const blob = new Blob([JSON.stringify({ entries: store.entries, metrics: store.metrics, metricPoints: store.metricPoints, me: store.me }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `搞钱局-备份-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  return (
    <Sheet open onClose={onClose} title="设置">
      <div className="space-y-2">
        <Row label="账号状态" value={store.cloud ? '已联机（云端同步）' : store.session?.provider === 'demo' ? '本地账号' : '本地模式'} />
        <button onClick={onAuth} className="card card-tap w-full p-3.5 flex items-center justify-between text-left">
          <div><div className="font-semibold text-sm">登录 / 绑定账号</div><div className="text-xs text-muted">邮箱 · 手机 · 微信</div></div>
          <span className="text-accent text-sm">{store.cloud ? '管理' : '去登录'}</span>
        </button>
        <Row label="主题" value={<button onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} className="text-accent">{store.theme === 'dark' ? '深色' : '浅色'}</button>} />
        <button onClick={exportData} className="card card-tap w-full p-3.5 text-left"><div className="font-semibold text-sm">导出我的数据</div><div className="text-xs text-muted">JSON 备份，随时可迁移</div></button>
        <Row label="版本" value="0.1.0 · MVP" />
      </div>
      <Button variant="line" onClick={() => { if (confirm('确定退出登录？本地数据会保留。')) { store.signOut(); onClose() } }} className="w-full mt-4 text-loss">退出登录</Button>
      <p className="text-xs text-faint text-center mt-3 leading-relaxed">搞钱局记录的是你真实的历程。真实、可验证，才有意义。</p>
    </Sheet>
  )
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-subtle"><span className="text-sm text-muted">{label}</span><span className="text-sm font-medium">{value}</span></div>
}

export { INCOME_SOURCES }
