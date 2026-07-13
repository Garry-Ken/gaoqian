import { useEffect, useRef, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { Onboarding } from './views/Onboarding'
import { Home } from './views/Home'
import { Log } from './views/Log'
import { Leaderboards } from './views/Leaderboards'
import { Arena } from './views/Arena'
import { Me } from './views/Me'
import { EntrySheet } from './components/EntrySheet'
import { ProfileSheet } from './components/ProfileSheet'
import { ShareSheet } from './components/ShareCard'
import { Ceremony, type CeremonyPayload } from './components/Ceremony'
import { cx } from './components/ui'
import { wan } from './lib/format'
import { IconHome, IconLog, IconTrophy, IconDice, IconUser, IconPlus, IconMoon, IconSun } from './components/icons'

type Tab = 'home' | 'log' | 'rank' | 'arena' | 'me'
const TABS: { id: Tab; label: string; icon: (p: object) => React.ReactNode }[] = [
  { id: 'home', label: '首页', icon: IconHome },
  { id: 'log', label: '记录', icon: IconLog },
  { id: 'rank', label: '榜单', icon: IconTrophy },
  { id: 'arena', label: '局', icon: IconDice },
  { id: 'me', label: '我的', icon: IconUser },
]

function Shell() {
  const store = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [logOpen, setLogOpen] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [ceremony, setCeremony] = useState<CeremonyPayload | null>(null)
  const prevTier = useRef<number | null>(null)
  const prevBreak = useRef<number | null>(null)

  // ceremony detection
  const stats = store.stats
  useEffect(() => {
    if (!stats) return
    if (prevTier.current === null) { prevTier.current = stats.currentTier.index; prevBreak.current = stats.breakthroughs.length; return }
    if (stats.currentTier.index > prevTier.current) {
      setCeremony({ kind: 'rankup', tier: stats.currentTier, title: `晋级 ${stats.currentTier.name}`, sub: `${stats.currentTier.subtitle} · ${stats.currentTier.rankLabel}` })
    } else if (stats.breakthroughs.length > (prevBreak.current ?? 0)) {
      const b = stats.breakthroughs[0]
      setCeremony({ kind: 'breakthrough', title: b.label, sub: `单月冲到 ${wan(b.amount)}，继续！` })
    }
    prevTier.current = stats.currentTier.index
    prevBreak.current = stats.breakthroughs.length
  }, [stats])

  if (!store.ready) {
    return <div className="min-h-full flex items-center justify-center"><div className="w-10 h-10 rounded-2xl shimmer" /></div>
  }
  if (!store.me) return <Onboarding />

  const openProfile = (id: string) => setProfileId(id)

  return (
    <div className="app-shell min-h-screen flex flex-col max-w-md mx-auto w-full relative">
      {/* top bar */}
      <header className="sticky top-0 z-30 glass safe-top">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img src="./icon.svg" className="w-7 h-7 rounded-lg" />
            <span className="font-bold">搞钱局</span>
            {!store.supabaseConfigured && <span className="pill bg-subtle text-faint text-[0.6rem]">本地模式</span>}
            {store.cloud && <span className="pill bg-gain/15 text-gain text-[0.6rem]">已联机</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {stats && <span className="pill bg-subtle text-muted">Lv.{stats.level}</span>}
            <button onClick={() => store.setTheme(store.theme === 'dark' ? 'light' : 'dark')} className="tap w-8 h-8 rounded-full bg-subtle flex items-center justify-center text-muted">
              {store.theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
          </div>
        </div>
      </header>

      {/* content */}
      <main className="flex-1 px-4 pt-3 pb-28">
        {tab === 'home' && <Home onQuickLog={() => setLogOpen(true)} onOpenProfile={openProfile} onShare={() => setShareOpen(true)} goTab={(t) => setTab(t as Tab)} />}
        {tab === 'log' && <Log onOpenProfile={openProfile} />}
        {tab === 'rank' && <Leaderboards onOpenProfile={openProfile} />}
        {tab === 'arena' && <Arena onOpenProfile={openProfile} />}
        {tab === 'me' && <Me onOpenProfile={openProfile} onShare={() => setShareOpen(true)} />}
      </main>

      {/* FAB — hidden on 榜单 (collides with the sticky my-rank bar) */}
      {tab !== 'rank' && (
        <button onClick={() => setLogOpen(true)}
          className="fixed z-40 bottom-24 right-1/2 translate-x-[172px] max-[420px]:right-4 max-[420px]:translate-x-0 w-14 h-14 rounded-full btn-gold flex items-center justify-center text-2xl shadow-glow tap"
          aria-label="记一笔">
          <IconPlus />
        </button>
      )}

      {/* tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 glass border-t hairline safe-bottom">
        <div className="flex">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cx('flex-1 flex flex-col items-center gap-0.5 py-2 tap', active ? 'text-accent' : 'text-faint')}>
                <span className="text-xl"><Icon /></span>
                <span className="text-[0.62rem] font-medium">{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <EntrySheet open={logOpen} onClose={() => setLogOpen(false)} />
      {profileId && <ProfileSheet id={profileId} onClose={() => setProfileId(null)} />}
      {shareOpen && <ShareSheet onClose={() => setShareOpen(false)} />}
      {ceremony && <Ceremony payload={ceremony} onClose={() => setCeremony(null)} onShare={() => { setCeremony(null); setShareOpen(true) }} />}
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
