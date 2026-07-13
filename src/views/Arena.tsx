import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Team, MeetEvent, FeedItem } from '../types'
import { CITIES, EVENT_TAGS } from '../lib/catalog'
import { wan, dateLabel, relativeTime } from '../lib/format'
import { Segmented, Sheet, Button, Avatar, Pill, EmptyState, cx } from '../components/ui'
import { IconMap, IconCal, IconUsers, IconHeart, IconPlus } from '../components/icons'

export function Arena({ onOpenProfile }: { onOpenProfile: (id: string) => void }) {
  const store = useStore()
  const { me, teams, events, feed, getProfile } = useStore()
  const [sub, setSub] = useState<'team' | 'meet' | 'feed'>('meet')
  const [createTeam, setCreateTeam] = useState(false)
  const [createEvent, setCreateEvent] = useState(false)
  const [eventDetail, setEventDetail] = useState<MeetEvent | null>(null)
  const [cityOnly, setCityOnly] = useState(false)

  const myTeam = teams.find((t) => t.memberIds.includes(me?.id ?? ''))
  const upcoming = useMemo(() => {
    let list = [...events].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))
    if (cityOnly && me?.city) list = list.filter((e) => e.city === me.city)
    return list
  }, [events, cityOnly, me])
  const sortedFeed = useMemo(() => [...feed].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 60), [feed])

  return (
    <div className="space-y-4 pb-4">
      <Segmented options={[{ id: 'meet', label: '同城局' }, { id: 'team', label: '战队' }, { id: 'feed', label: '动态' }]} value={sub} onChange={setSub} />

      {/* 同城局 */}
      {sub === 'meet' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setCityOnly((v) => !v)} className={cx('pill !py-2', cityOnly ? 'bg-accent text-white' : 'bg-subtle text-muted')}><IconMap /> {cityOnly ? (me?.city ?? '同城') : '全部城市'}</button>
            <button onClick={() => setCreateEvent(true)} className="text-accent text-sm flex items-center gap-0.5"><IconPlus /> 发起局</button>
          </div>
          {upcoming.length === 0 ? <EmptyState emoji="🍻" title="还没有同城局" sub="发起一场线下局，把榜上的搞钱人约到线下——真实的连接才是这局的重点。" action={<Button onClick={() => setCreateEvent(true)}>发起同城局</Button>} />
            : upcoming.map((e) => <EventCard key={e.id} e={e} host={getProfile(e.hostId)} joined={!!me && e.attendeeIds.includes(me.id)} onClick={() => setEventDetail(e)} />)}
        </div>
      )}

      {/* 战队 */}
      {sub === 'team' && (
        <div className="space-y-3">
          {myTeam ? <MyTeamCard team={myTeam} onOpenProfile={onOpenProfile} onLeave={() => store.leaveTeam()} /> : (
            <button onClick={() => setCreateTeam(true)} className="card card-tap w-full p-4 flex items-center gap-3 text-accent">
              <div className="w-10 h-10 rounded-2xl bg-accent/15 flex items-center justify-center text-xl"><IconPlus /></div>
              <div className="text-left flex-1"><div className="font-semibold text-fg text-sm">创建自己的战队</div><div className="text-xs text-muted">拉上搞钱搭子，一起冲战队榜</div></div>
            </button>
          )}
          <div className="text-sm font-bold px-1 pt-2">热门战队</div>
          {teams.filter((t) => t.id !== myTeam?.id).map((t) => <TeamRow key={t.id} team={t} canJoin={!myTeam} onJoin={() => store.joinTeam(t.id)} />)}
        </div>
      )}

      {/* 动态 */}
      {sub === 'feed' && (
        <div className="space-y-2">
          {sortedFeed.map((f) => <FeedCard key={f.id} f={f} onOpenProfile={onOpenProfile} />)}
        </div>
      )}

      {createTeam && <CreateTeamSheet onClose={() => setCreateTeam(false)} />}
      {createEvent && <CreateEventSheet onClose={() => setCreateEvent(false)} />}
      {eventDetail && <EventDetailSheet e={eventDetail} onClose={() => setEventDetail(null)} onOpenProfile={onOpenProfile} />}
    </div>
  )
}

function FeedCard({ f, onOpenProfile }: { f: FeedItem; onOpenProfile: (id: string) => void }) {
  const { getProfile, me, cheer, comments, addComment, now } = useStore()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const actor = getProfile(f.actorId)
  if (!actor) return null
  const cheered = !!me && f.cheers.includes(me.id)
  const thread = comments.filter((c) => c.feedId === f.id).sort((a, b) => +new Date(a.at) - +new Date(b.at))

  return (
    <div className="card p-3">
      <div className="flex items-start gap-3">
        <button onClick={() => onOpenProfile(actor.id)}><Avatar emoji={actor.avatar} size={40} /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <button onClick={() => onOpenProfile(actor.id)} className="text-sm font-semibold truncate">{actor.name}</button>
            <span className="text-[0.65rem] text-faint">{relativeTime(f.at, now)}</span>
            {f.kind === 'breakthrough' && <Pill tone="gold">🔥 爆发</Pill>}
            {f.kind === 'rankup' && <Pill tone="accent">⬆️ 升段</Pill>}
          </div>
          <div className="text-sm mt-0.5">{f.text}{f.amount ? <span className="num font-bold text-gain"> {wan(f.amount)}</span> : ''}</div>
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => cheer(f.id)} className={cx('flex items-center gap-1 text-xs', cheered ? 'text-loss' : 'text-faint')}>
              <IconHeart /> {f.cheers.length > 0 ? f.cheers.length : '加油'}
            </button>
            <button onClick={() => setOpen((v) => !v)} className={cx('flex items-center gap-1 text-xs', open ? 'text-accent' : 'text-faint')}>
              💬 {thread.length > 0 ? thread.length : '评论'}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t hairline space-y-2.5">
          {thread.map((c) => {
            const au = getProfile(c.authorId)
            return (
              <div key={c.id} className="flex items-start gap-2">
                <button onClick={() => au && onOpenProfile(au.id)}><Avatar emoji={au?.avatar ?? '🧑'} size={26} /></button>
                <div className="text-xs flex-1 min-w-0"><span className="font-semibold">{au?.name ?? '某人'}</span> <span className="text-muted">{c.text}</span></div>
              </div>
            )
          })}
          {thread.length === 0 && <div className="text-xs text-faint">还没有评论，来第一个</div>}
          {me && (
            <div className="flex gap-2 pt-1">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { addComment(f.id, draft); setDraft('') } }} placeholder="说点什么…" className="input !py-2 text-sm" />
              <Button onClick={() => { if (draft.trim()) { addComment(f.id, draft); setDraft('') } }} disabled={!draft.trim()} className="!px-4 !py-2 text-sm">发</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EventCard({ e, host, joined, onClick }: { e: MeetEvent; host?: { name: string; avatar: string }; joined: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card card-tap w-full p-4 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold">{e.title}</div>
        {joined && <Pill tone="gain">已报名</Pill>}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted">
        <span className="flex items-center gap-1"><IconCal /> {dateLabel(e.startAt)}</span>
        <span className="flex items-center gap-1"><IconMap /> {e.city} · {e.location}</span>
        <span className="flex items-center gap-1"><IconUsers /> {e.attendeeIds.length}/{e.capacity}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {e.tags.map((t) => <span key={t} className="pill bg-subtle text-[0.62rem]">{t}</span>)}
        {host && <span className="ml-auto text-xs text-faint">{host.avatar} {host.name} 发起</span>}
      </div>
    </button>
  )
}

function MyTeamCard({ team, onOpenProfile, onLeave }: { team: Team; onOpenProfile: (id: string) => void; onLeave: () => void }) {
  const { getProfile } = useStore()
  const members = team.memberIds.map(getProfile).filter(Boolean) as { id: string; name: string; avatar: string; snapMonthIncome?: number }[]
  const total = members.reduce((s, m) => s + (m.snapMonthIncome ?? 0), 0)
  return (
    <div className="card p-4" style={{ background: 'linear-gradient(160deg, rgb(var(--accent)/0.12), rgb(var(--surface)))' }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-subtle flex items-center justify-center text-2xl">{team.emoji}</div>
        <div className="flex-1"><div className="font-bold">{team.name}</div><div className="text-xs text-muted">{team.city} · {members.length}人 · {team.motto}</div></div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t hairline">
        <div><div className="text-xs text-muted">战队本月合计</div><div className="num text-xl font-bold text-gain">{wan(total)}</div></div>
        <button onClick={onLeave} className="text-xs text-loss">退出战队</button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {members.map((m) => (
          <button key={m.id} onClick={() => onOpenProfile(m.id)} className="flex items-center gap-1.5 pill bg-subtle"><span>{m.avatar}</span>{m.name}</button>
        ))}
      </div>
    </div>
  )
}

function TeamRow({ team, canJoin, onJoin }: { team: Team; canJoin: boolean; onJoin: () => void }) {
  const { getProfile } = useStore()
  const total = team.memberIds.map(getProfile).reduce((s, m) => s + (m?.snapMonthIncome ?? 0), 0)
  return (
    <div className="card p-3.5 flex items-center gap-3">
      <div className="w-11 h-11 rounded-2xl bg-subtle flex items-center justify-center text-xl">{team.emoji}</div>
      <div className="flex-1 min-w-0"><div className="font-semibold text-sm truncate">{team.name}</div><div className="text-xs text-muted">{team.city} · {team.memberIds.length}人 · 合计 {wan(total)}</div></div>
      {canJoin && <Button variant="ghost" onClick={onJoin} className="!px-4 !py-2 text-sm">加入</Button>}
    </div>
  )
}

function CreateTeamSheet({ onClose }: { onClose: () => void }) {
  const { createTeam } = useStore()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🚀')
  const [city, setCity] = useState('')
  const [motto, setMotto] = useState('')
  return (
    <Sheet open onClose={onClose} title="创建战队">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 2))} className="input !w-16 text-center text-xl" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="战队名，如「深圳搞钱特工队」" className="input" autoFocus />
        </div>
        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto no-scrollbar">
          {CITIES.slice(0, 16).map((c) => <button key={c} onClick={() => setCity(c)} className={cx('pill', city === c ? 'bg-accent text-white' : 'bg-subtle text-muted')}>{c}</button>)}
        </div>
        <input value={motto} onChange={(e) => setMotto(e.target.value)} placeholder="战队口号（可选）" className="input" />
        <Button onClick={() => { if (name.trim()) { createTeam({ name: name.trim(), emoji, city: city || undefined, motto: motto || undefined }); onClose() } }} disabled={!name.trim()} className="w-full">创建并加入</Button>
      </div>
    </Sheet>
  )
}

function CreateEventSheet({ onClose }: { onClose: () => void }) {
  const { createEvent, me } = useStore()
  const [title, setTitle] = useState('')
  const [city, setCity] = useState(me?.city ?? '')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10))
  const [capacity, setCapacity] = useState('8')
  const [tags, setTags] = useState<string[]>(['饭局'])
  const [desc, setDesc] = useState('')
  const toggle = (t: string) => setTags((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])
  return (
    <Sheet open onClose={onClose} title="发起同城局">
      <div className="space-y-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="局的主题，如「搞钱局·周五夜谈」" className="input" autoFocus />
        <div className="grid grid-cols-2 gap-3">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="城市" className="input" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input text-sm" />
        </div>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="地点（报名后可见更详细地址）" className="input" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">人数上限</span>
          <input inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ''))} className="input num !w-20" />
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_TAGS.map((t) => <button key={t} onClick={() => toggle(t)} className={cx('pill', tags.includes(t) ? 'bg-accent text-white' : 'bg-subtle text-muted')}>{t}</button>)}
        </div>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="想聊什么？带上你最近的一个尝试…" className="input" rows={2} />
        <Button onClick={() => { if (title.trim() && city.trim()) { createEvent({ title: title.trim(), city: city.trim(), location: location.trim() || `${city}·待定`, startAt: new Date(date + 'T19:00:00').toISOString(), capacity: Number(capacity) || 8, tags, description: desc.trim() || '真实搞钱人的线下局。' }); onClose() } }} disabled={!title.trim() || !city.trim()} className="w-full">发起（自动报名）</Button>
      </div>
    </Sheet>
  )
}

function EventDetailSheet({ e, onClose, onOpenProfile }: { e: MeetEvent; onClose: () => void; onOpenProfile: (id: string) => void }) {
  const { me, rsvp, getProfile, events } = useStore()
  const live = events.find((x) => x.id === e.id) ?? e
  const joined = !!me && live.attendeeIds.includes(me.id)
  const full = live.attendeeIds.length >= live.capacity && !joined
  return (
    <Sheet open onClose={onClose} title="同城局">
      <div className="font-bold text-lg">{live.title}</div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted">
        <span className="flex items-center gap-1"><IconCal /> {dateLabel(live.startAt)} 19:00</span>
        <span className="flex items-center gap-1"><IconMap /> {live.city} · {joined ? live.location : '报名后可见详细地址'}</span>
      </div>
      <div className="flex gap-1.5 mt-2 flex-wrap">{live.tags.map((t) => <span key={t} className="pill bg-subtle">{t}</span>)}</div>
      <p className="text-sm text-muted mt-3 leading-relaxed">{live.description}</p>
      <div className="mt-4">
        <div className="text-xs text-muted mb-2 flex items-center gap-1"><IconUsers /> 已报名 {live.attendeeIds.length}/{live.capacity}</div>
        <div className="flex flex-wrap gap-2">
          {live.attendeeIds.slice(0, 12).map((id) => { const p = getProfile(id); return p ? <button key={id} onClick={() => onOpenProfile(id)} className="pill bg-subtle"><span>{p.avatar}</span>{p.name}</button> : null })}
        </div>
      </div>
      <Button variant={joined ? 'line' : 'gold'} disabled={full} onClick={() => rsvp(live.id, !joined)} className="w-full mt-5">
        {joined ? '取消报名' : full ? '已满员' : '报名参加 🙌'}
      </Button>
      {!joined && <p className="text-xs text-faint text-center mt-2">线下见面请注意安全，核实对方身份</p>}
    </Sheet>
  )
}
