import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Profile } from '../types'
import { tierById } from '../lib/tiers'
import { wan, pct } from '../lib/format'
import { Avatar, TierBadge, Pill, Segmented, cx } from '../components/ui'
import { IconBolt, IconFlame, IconShield } from '../components/icons'

type Board = 'tier' | 'income' | 'momentum' | 'effort' | 'streak' | 'rookie'
type Scope = 'nation' | 'city' | 'team'

const BOARDS: { id: Board; label: string; hint: string }[] = [
  { id: 'income', label: '月收入榜', hint: '本月真实进账' },
  { id: 'tier', label: '段位榜', hint: '当前段位高低' },
  { id: 'momentum', label: '势能榜', hint: '涨得最快 · 新人也能登顶' },
  { id: 'effort', label: '工作量榜', hint: '本周最能扛' },
  { id: 'streak', label: '坚持榜', hint: '连续月数' },
  { id: 'rookie', label: '新星榜', hint: '入局最猛的新人' },
]

export function Leaderboards({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const { allProfiles, me, teams, now } = useStore()
  const [board, setBoard] = useState<Board>('income')
  const [scope, setScope] = useState<Scope>('nation')
  const [verified, setVerified] = useState(false)

  const myTeam = teams.find((t) => t.memberIds.includes(me?.id ?? ''))
  const seasonDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

  const ranked = useMemo(() => {
    let pool = allProfiles
    if (scope === 'city' && me?.city) pool = pool.filter((p) => p.city === me.city)
    if (scope === 'team') pool = pool.filter((p) => myTeam?.memberIds.includes(p.id))
    const inc = (p: Profile) => (verified ? p.snapVerifiedMonthIncome ?? 0 : p.snapMonthIncome ?? 0)
    const arr = [...pool]
    if (board === 'income') arr.sort((a, b) => inc(b) - inc(a))
    else if (board === 'tier') arr.sort((a, b) => tierById(b.snapCurrentTier ?? 't0').index - tierById(a.snapCurrentTier ?? 't0').index || inc(b) - inc(a))
    else if (board === 'momentum') arr.sort((a, b) => (b.snapMomentum ?? 0) - (a.snapMomentum ?? 0))
    else if (board === 'effort') arr.sort((a, b) => (b.snapEffortWeek ?? 0) - (a.snapEffortWeek ?? 0))
    else if (board === 'streak') arr.sort((a, b) => (b.snapStreakMonths ?? 0) - (a.snapStreakMonths ?? 0))
    else { // rookie
      arr.sort((a, b) => (b.snapMomentum ?? 0) - (a.snapMomentum ?? 0))
      return arr.filter((p) => (now.getTime() - +new Date(p.joinedAt)) / 86400000 < 150).slice(0, 50)
    }
    return arr.slice(0, 60)
  }, [allProfiles, scope, board, verified, me, myTeam, now])

  const myRank = ranked.findIndex((p) => p.id === me?.id)
  const boardMeta = BOARDS.find((b) => b.id === board)!

  return (
    <div className="space-y-3 pb-4">
      {/* season header */}
      <div className="card p-3.5 flex items-center justify-between overflow-hidden relative">
        <div>
          <div className="text-xs text-muted">当前赛季</div>
          <div className="font-bold">S{now.getMonth() + 1} · {now.getFullYear()} 盛夏局</div>
        </div>
        <Pill tone="gold">还剩 {seasonDays} 天结算</Pill>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {BOARDS.map((b) => (
          <button key={b.id} onClick={() => setBoard(b.id)} className={cx('pill shrink-0 !px-3 !py-2', board === b.id ? 'bg-accent text-white' : 'bg-subtle text-muted')}>{b.label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Segmented className="flex-1" options={[{ id: 'nation', label: '全国' }, { id: 'city', label: me?.city ?? '同城' }, { id: 'team', label: '战队' }]} value={scope} onChange={setScope} />
        {board === 'income' && (
          <button onClick={() => setVerified((v) => !v)} className={cx('pill shrink-0 !py-2', verified ? 'bg-gain/15 text-gain' : 'bg-subtle text-muted')}>
            <IconShield /> {verified ? '真实榜' : '江湖榜'}
          </button>
        )}
      </div>
      <div className="text-xs text-faint px-1">{boardMeta.hint}{board === 'income' && verified && ' · 仅计带凭证的收入'}</div>

      {scope === 'team' && !myTeam ? (
        <div className="text-center text-sm text-muted py-10">你还没有战队，去「局」里加入或创建一个 →</div>
      ) : (
        <div className="space-y-2">
          {ranked.map((p, i) => <RankRow key={p.id} p={p} rank={i} board={board} verified={verified} isMe={p.id === me?.id} onClick={() => onOpenProfile(p.id)} />)}
          {ranked.length === 0 && <div className="text-center text-sm text-faint py-10">这个榜暂时还没人</div>}
        </div>
      )}

      {/* my sticky rank */}
      {myRank >= 0 && me && (
        <div className="sticky bottom-20 z-10 mt-3">
          <div className="card !bg-accent/90 backdrop-blur p-3 flex items-center gap-3 text-white shadow-pop">
            <div className="w-7 text-center font-bold num">{myRank + 1}</div>
            <Avatar emoji={me.avatar} size={34} />
            <div className="flex-1 text-sm font-semibold">我 · {me.name}</div>
            <div className="num font-bold">{boardValue(allProfiles.find((p) => p.id === me.id)!, board, verified)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function boardValue(p: Profile, board: Board, verified: boolean): string {
  if (board === 'momentum') return pct(p.snapMomentum ?? 0)
  if (board === 'effort') return String(p.snapEffortWeek ?? 0)
  if (board === 'streak') return `${p.snapStreakMonths ?? 0}月`
  return wan(verified ? p.snapVerifiedMonthIncome ?? 0 : p.snapMonthIncome ?? 0)
}

function RankRow({ p, rank, board, verified, isMe, onClick }: { p: Profile; rank: number; board: Board; verified: boolean; isMe: boolean; onClick: () => void }) {
  const cur = tierById(p.snapCurrentTier ?? 't0')
  const medal = ['🥇', '🥈', '🥉'][rank]
  return (
    <button onClick={onClick} className={cx('card card-tap w-full p-3 flex items-center gap-3 text-left', isMe && 'ring-2 ring-accent')}>
      <div className="w-7 text-center shrink-0">{medal ? <span className="text-xl">{medal}</span> : <span className="num text-sm font-bold text-faint">{rank + 1}</span>}</div>
      <Avatar emoji={p.avatar} size={38} ring={rank < 3 ? cur.color : undefined} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate flex items-center gap-1.5">{p.name}{isMe && <Pill tone="accent">我</Pill>}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <TierBadge tier={cur} size="sm" />
          {p.city && <span className="text-[0.65rem] text-faint">{p.city}</span>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className={cx('num text-base font-bold', board === 'momentum' && (p.snapMomentum ?? 0) >= 0 ? 'text-gain' : board === 'momentum' ? 'text-loss' : 'text-fg')}>{boardValue(p, board, verified)}</div>
        {board !== 'momentum' && <div className="text-[0.6rem] text-faint flex items-center justify-end gap-0.5">{board === 'effort' ? <><IconFlame />本周</> : board === 'streak' ? '连续' : <><IconBolt />{pct(p.snapMomentum ?? 0)}</>}</div>}
      </div>
    </button>
  )
}
