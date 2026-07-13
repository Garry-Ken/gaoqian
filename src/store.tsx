import {
  createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import type {
  Profile, Entry, CustomMetric, MetricPoint, Team, MeetEvent, FeedItem, Endorsement, PlayerStats, Comment,
} from './types'
import { load, save, KEYS } from './lib/storage'
import { uid } from './lib/id'
import { buildWorld } from './lib/seed'
import { computeStats } from './lib/engine'
import { tierForIncome } from './lib/tiers'
import { SUPABASE_READY, supabase } from './lib/supabase'
import { cloud, cloudActive, pullWorld, pullMine } from './lib/cloud'
import { todayISO } from './lib/format'

export interface SessionUser {
  id: string
  provider: 'demo' | 'email' | 'phone' | 'wechat'
  email?: string
}

type Theme = 'dark' | 'light'

interface StoreValue {
  ready: boolean
  cloud: boolean
  supabaseConfigured: boolean
  session: SessionUser | null
  me: Profile | null
  meRow: Profile | null // me merged with live snapshot for leaderboards
  entries: Entry[]
  metrics: CustomMetric[]
  metricPoints: MetricPoint[]
  profiles: Profile[] // the world (others)
  allProfiles: Profile[] // world + me
  teams: Team[]
  events: MeetEvent[]
  feed: FeedItem[]
  comments: Comment[]
  endorsements: Endorsement[]
  stats: PlayerStats | null
  now: Date
  theme: Theme
  inviteLink: string
  // lifecycle
  onboard: (p: { name: string; avatar: string; city?: string; goalMonthly?: number }) => void
  signOut: () => void
  setTheme: (t: Theme) => void
  getProfile: (id: string) => Profile | undefined
  // entries
  saveEntry: (e: Partial<Entry> & { type: Entry['type'] }) => Entry
  deleteEntry: (id: string) => void
  // metrics
  saveMetric: (m: Partial<CustomMetric> & { name: string }) => CustomMetric
  deleteMetric: (id: string) => void
  addMetricPoint: (metricId: string, value: number, at?: string, note?: string) => void
  // profile
  updateMe: (patch: Partial<Profile>) => void
  // teams
  createTeam: (t: { name: string; emoji: string; city?: string; motto?: string }) => Team
  joinTeam: (id: string) => void
  leaveTeam: () => void
  // events
  createEvent: (e: Omit<MeetEvent, 'id' | 'hostId' | 'attendeeIds' | 'createdAt'>) => MeetEvent
  rsvp: (id: string, going: boolean) => void
  // feed / social
  cheer: (feedId: string) => void
  pushFeed: (f: Omit<FeedItem, 'id' | 'actorId' | 'at' | 'cheers'>) => void
  addComment: (feedId: string, text: string) => void
  endorse: (toId: string, note?: string, entryId?: string) => void
  // auth (cloud)
  sendEmailOtp: (email: string) => Promise<{ ok: boolean; msg: string }>
  verifyEmailOtp: (email: string, token: string) => Promise<{ ok: boolean; msg: string }>
}

const Ctx = createContext<StoreValue | null>(null)
export const useStore = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [now] = useState(() => new Date())
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<SessionUser | null>(() => load<SessionUser | null>(KEYS.session, null))
  const [me, setMe] = useState<Profile | null>(null)
  const [entries, setEntries] = useState<Entry[]>(() => load<Entry[]>(KEYS.entries, []))
  const [metrics, setMetrics] = useState<CustomMetric[]>(() => load<CustomMetric[]>(KEYS.metrics, []))
  const [metricPoints, setMetricPoints] = useState<MetricPoint[]>(() => load<MetricPoint[]>(KEYS.metricPoints, []))
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [events, setEvents] = useState<MeetEvent[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [endorsements, setEndorsements] = useState<Endorsement[]>([])
  const [theme, setThemeState] = useState<Theme>(() => load<Theme>(KEYS.theme, 'dark'))
  const cloudOn = cloudActive()

  // ---- theme ----
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
    save(KEYS.theme, theme)
  }, [theme])

  // ---- boot: seed or load world, restore me, optional cloud pull ----
  useEffect(() => {
    const seeded = load<boolean>(KEYS.seeded, false)
    if (seeded) {
      setProfiles(load<Profile[]>(KEYS.profiles, []))
      setTeams(load<Team[]>(KEYS.teams, []))
      setEvents(load<MeetEvent[]>(KEYS.events, []))
      setFeed(load<FeedItem[]>(KEYS.feed, []))
      setComments(load<Comment[]>(KEYS.comments, []))
      setEndorsements(load<Endorsement[]>(KEYS.endorsements, []))
    } else {
      const w = buildWorld(now)
      setProfiles(w.profiles); setTeams(w.teams); setEvents(w.events); setFeed(w.feed); setComments(w.comments); setEndorsements(w.endorsements)
      save(KEYS.profiles, w.profiles); save(KEYS.teams, w.teams); save(KEYS.events, w.events)
      save(KEYS.feed, w.feed); save(KEYS.comments, w.comments); save(KEYS.endorsements, w.endorsements); save(KEYS.seeded, true)
    }
    // restore my profile from world store (kept alongside others under a reserved id)
    const savedMe = load<Profile | null>('me.profile.v1', null)
    if (savedMe) setMe(savedMe)
    setReady(true)

    if (cloudOn && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) hydrateCloudSession(data.session.user.id, data.session.user.email ?? undefined)
      })
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (s) hydrateCloudSession(s.user.id, s.user.email ?? undefined)
      })
      void pullWorld().then((w) => {
        if (w?.profiles?.length) setProfiles((prev) => mergeById(prev, w.profiles!.filter((p) => p.id !== me?.id)))
        if (w?.teams?.length) setTeams((prev) => mergeById(prev, w.teams!))
        if (w?.events?.length) setEvents((prev) => mergeById(prev, w.events!))
        if (w?.feed?.length) setFeed((prev) => mergeById(prev, w.feed!))
        if (w?.comments?.length) setComments((prev) => mergeById(prev, w.comments!))
        if (w?.endorsements?.length) setEndorsements((prev) => mergeById(prev, w.endorsements!))
      })
      return () => sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function hydrateCloudSession(userId: string, email?: string) {
    const sess: SessionUser = { id: userId, provider: 'email', email }
    setSession(sess); save(KEYS.session, sess)
    const mine = await pullMine(userId)
    if (mine) {
      if (mine.entries.length) { setEntries(mine.entries); save(KEYS.entries, mine.entries) }
      if (mine.metrics.length) { setMetrics(mine.metrics); save(KEYS.metrics, mine.metrics) }
      if (mine.points.length) { setMetricPoints(mine.points); save(KEYS.metricPoints, mine.points) }
    }
    setMe((prev) => {
      const next: Profile = prev ?? {
        id: userId, handle: 'me', name: '我', avatar: '🧑', joinedAt: todayISO(),
        visibility: 'public', authProvider: 'email',
      }
      const merged = { ...next, id: userId, authProvider: 'email' as const }
      save('me.profile.v1', merged)
      return merged
    })
  }

  // ---- persistence ----
  useEffect(() => { if (ready) save(KEYS.entries, entries) }, [entries, ready])
  useEffect(() => { if (ready) save(KEYS.metrics, metrics) }, [metrics, ready])
  useEffect(() => { if (ready) save(KEYS.metricPoints, metricPoints) }, [metricPoints, ready])
  useEffect(() => { if (ready) save(KEYS.profiles, profiles) }, [profiles, ready])
  useEffect(() => { if (ready) save(KEYS.teams, teams) }, [teams, ready])
  useEffect(() => { if (ready) save(KEYS.events, events) }, [events, ready])
  useEffect(() => { if (ready) save(KEYS.feed, feed) }, [feed, ready])
  useEffect(() => { if (ready) save(KEYS.comments, comments) }, [comments, ready])
  useEffect(() => { if (ready) save(KEYS.endorsements, endorsements) }, [endorsements, ready])
  useEffect(() => { if (me) save('me.profile.v1', me) }, [me])

  // ---- derived stats for me ----
  const stats = useMemo<PlayerStats | null>(() => {
    if (!me) return null
    const aux = {
      endorsementsGiven: endorsements.filter((e) => e.fromId === me.id).length,
      endorsementsReceived: endorsements.filter((e) => e.toId === me.id).length,
      eventsAttended: events.filter((e) => e.attendeeIds.includes(me.id) && new Date(e.startAt) < now).length,
    }
    return computeStats(me, entries, aux, now)
  }, [me, entries, endorsements, events, now])

  const meRow = useMemo<Profile | null>(() => {
    if (!me || !stats) return me
    return {
      ...me,
      snapMonthIncome: stats.monthIncome,
      snapVerifiedMonthIncome: stats.verifiedMonthIncome,
      snapCurrentTier: stats.currentTier.id,
      snapPeakTier: stats.peakTier.id,
      snapVerifiedTier: stats.verifiedTier.id,
      snapMomentum: Math.round(stats.momentum),
      snapEffortWeek: stats.effortWeek,
      snapStreakMonths: stats.streakMonths,
      snapIntegrity: stats.integrity,
      snapLevel: stats.level,
      snapTitles: stats.titles,
    }
  }, [me, stats])

  // mirror my live snapshot to cloud so rivals see my rank
  const lastSnap = useRef('')
  useEffect(() => {
    if (cloudOn && meRow) {
      const sig = `${meRow.snapMonthIncome}-${meRow.snapCurrentTier}-${meRow.snapMomentum}`
      if (sig !== lastSnap.current) { lastSnap.current = sig; void cloud.saveProfile(meRow) }
    }
  }, [cloudOn, meRow])

  // ---------------- actions ----------------
  const getProfile = (id: string) => (me && id === me.id ? meRow ?? me : profiles.find((p) => p.id === id))

  function onboard(p: { name: string; avatar: string; city?: string; goalMonthly?: number }) {
    const id = session?.id ?? `me_${uid()}`
    const prof: Profile = {
      id, handle: 'me', name: p.name, avatar: p.avatar, city: p.city, goalMonthly: p.goalMonthly,
      joinedAt: todayISO(), visibility: 'public', authProvider: session?.provider ?? 'demo',
    }
    setMe(prof); save('me.profile.v1', prof)
    if (!session) { const s: SessionUser = { id, provider: 'demo' }; setSession(s); save(KEYS.session, s) }
    save(KEYS.onboarded, true)
    if (cloudOn) void cloud.saveProfile(prof)
  }

  function signOut() {
    if (cloudOn && supabase) void supabase.auth.signOut()
    setSession(null); setMe(null)
    save(KEYS.session, null as unknown as SessionUser)
  }

  function setTheme(t: Theme) { setThemeState(t) }
  function updateMe(patch: Partial<Profile>) {
    setMe((prev) => { if (!prev) return prev; const n = { ...prev, ...patch }; if (cloudOn) void cloud.saveProfile(n); return n })
  }

  function saveEntry(input: Partial<Entry> & { type: Entry['type'] }): Entry {
    const nowIso = todayISO()
    const existing = input.id ? entries.find((e) => e.id === input.id) : undefined
    const e: Entry = {
      id: input.id ?? uid('e_'),
      ownerId: me?.id ?? 'me',
      type: input.type,
      title: input.title ?? '',
      note: input.note,
      occurredAt: input.occurredAt ?? nowIso,
      createdAt: existing?.createdAt ?? nowIso,
      updatedAt: existing ? nowIso : undefined,
      proofs: input.proofs ?? existing?.proofs ?? [],
      visibility: input.visibility ?? existing?.visibility ?? 'public',
      ventureId: input.ventureId ?? existing?.ventureId,
      history: existing?.history,
      amount: input.amount, source: input.source, recurring: input.recurring, proofLevel: input.proofLevel,
      category: input.category, status: input.status, investMoney: input.investMoney, investHours: input.investHours,
      outcome: input.outcome, lesson: input.lesson, startedAt: input.startedAt,
      effort: input.effort, effortUnit: input.effortUnit, count: input.count, kind: input.kind,
    }
    setEntries((prev) => (existing ? prev.map((x) => (x.id === e.id ? e : x)) : [e, ...prev]))
    if (cloudOn) void cloud.saveEntry(e)
    // auto-feed for notable new events
    if (!existing && me) {
      if (e.type === 'income' && (e.amount ?? 0) >= 5000) {
        pushFeedInternal({ kind: 'income', text: `记录了一笔收入`, amount: e.amount })
      } else if (e.type === 'milestone') {
        pushFeedInternal({ kind: 'milestone', text: e.title })
      }
    }
    return e
  }
  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
    if (cloudOn) void cloud.deleteEntry(id)
  }

  function saveMetric(input: Partial<CustomMetric> & { name: string }): CustomMetric {
    const existing = input.id ? metrics.find((m) => m.id === input.id) : undefined
    const m: CustomMetric = {
      id: input.id ?? uid('m_'), ownerId: me?.id ?? 'me', name: input.name,
      unit: input.unit ?? '', kind: input.kind ?? 'number', direction: input.direction ?? 'up',
      emoji: input.emoji, color: input.color, createdAt: existing?.createdAt ?? todayISO(),
    }
    setMetrics((prev) => (existing ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m]))
    if (cloudOn) void cloud.saveMetric(m)
    return m
  }
  function deleteMetric(id: string) {
    setMetrics((prev) => prev.filter((m) => m.id !== id))
    setMetricPoints((prev) => prev.filter((p) => p.metricId !== id))
    if (cloudOn) void cloud.deleteMetric(id)
  }
  function addMetricPoint(metricId: string, value: number, at?: string, note?: string) {
    const p: MetricPoint = { id: uid('mp_'), metricId, ownerId: me?.id ?? 'me', value, at: at ?? todayISO(), note }
    setMetricPoints((prev) => [...prev, p])
    if (cloudOn) void cloud.savePoint(p)
  }

  function createTeam(t: { name: string; emoji: string; city?: string; motto?: string }): Team {
    const team: Team = {
      id: uid('team_'), name: t.name, emoji: t.emoji, city: t.city, motto: t.motto,
      ownerId: me?.id ?? 'me', memberIds: me ? [me.id] : [], createdAt: todayISO(),
    }
    setTeams((prev) => [team, ...prev])
    if (me) updateMe({ teamId: team.id })
    if (cloudOn) void cloud.saveTeam(team)
    return team
  }
  function joinTeam(id: string) {
    if (!me) return
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, memberIds: uniq([...t.memberIds, me.id]) } : t)))
    updateMe({ teamId: id })
    const t = teams.find((x) => x.id === id)
    if (cloudOn && t) void cloud.saveTeam({ ...t, memberIds: uniq([...t.memberIds, me.id]) })
  }
  function leaveTeam() {
    if (!me?.teamId) return
    const id = me.teamId
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, memberIds: t.memberIds.filter((m) => m !== me.id) } : t)))
    updateMe({ teamId: undefined })
  }

  function createEvent(e: Omit<MeetEvent, 'id' | 'hostId' | 'attendeeIds' | 'createdAt'>): MeetEvent {
    const ev: MeetEvent = { ...e, id: uid('event_'), hostId: me?.id ?? 'me', attendeeIds: me ? [me.id] : [], createdAt: todayISO() }
    setEvents((prev) => [ev, ...prev])
    if (cloudOn) void cloud.saveEvent(ev)
    pushFeedInternal({ kind: 'event', text: `发起了一场同城局：${ev.title}` })
    return ev
  }
  function rsvp(id: string, going: boolean) {
    if (!me) return
    setEvents((prev) => prev.map((e) => {
      if (e.id !== id) return e
      const attendeeIds = going ? uniq([...e.attendeeIds, me.id]) : e.attendeeIds.filter((a) => a !== me.id)
      const next = { ...e, attendeeIds }
      if (cloudOn) void cloud.saveEvent(next)
      return next
    }))
  }

  function pushFeedInternal(f: { kind: FeedItem['kind']; text: string; amount?: number; tierId?: string }) {
    if (!me) return
    const item: FeedItem = { id: uid('feed_'), actorId: me.id, at: todayISO(), cheers: [], ...f }
    setFeed((prev) => [item, ...prev])
    if (cloudOn) void cloud.saveFeed(item)
  }
  function pushFeed(f: Omit<FeedItem, 'id' | 'actorId' | 'at' | 'cheers'>) { pushFeedInternal(f) }

  function addComment(feedId: string, text: string) {
    if (!me || !text.trim()) return
    const c: Comment = { id: uid('cm_'), feedId, authorId: me.id, text: text.trim(), at: todayISO() }
    setComments((prev) => [...prev, c])
    if (cloudOn) void cloud.saveComment(c)
  }

  function cheer(feedId: string) {
    if (!me) return
    setFeed((prev) => prev.map((f) => {
      if (f.id !== feedId) return f
      const cheers = f.cheers.includes(me.id) ? f.cheers.filter((c) => c !== me.id) : [...f.cheers, me.id]
      const next = { ...f, cheers }
      if (cloudOn) void cloud.saveFeed(next)
      return next
    }))
  }
  function endorse(toId: string, note?: string, entryId?: string) {
    if (!me) return
    const e: Endorsement = { id: uid('endo_'), fromId: me.id, toId, note, entryId, at: todayISO() }
    setEndorsements((prev) => [e, ...prev])
    if (cloudOn) void cloud.saveEndorsement(e)
  }

  async function sendEmailOtp(email: string) {
    if (!SUPABASE_READY || !supabase) return { ok: false, msg: '云端未配置，当前为本地模式。可直接用昵称开局。' }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    return error ? { ok: false, msg: zhAuth(error.message) } : { ok: true, msg: '验证码已发送到邮箱' }
  }
  async function verifyEmailOtp(email: string, token: string) {
    if (!SUPABASE_READY || !supabase) return { ok: false, msg: '云端未配置' }
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    return error ? { ok: false, msg: zhAuth(error.message) } : { ok: true, msg: '登录成功' }
  }

  const allProfiles = useMemo(() => (meRow ? [meRow, ...profiles.filter((p) => p.id !== meRow.id)] : profiles), [meRow, profiles])

  const inviteLink = typeof window !== 'undefined' ? window.location.origin + (import.meta.env.BASE_URL || '/') : ''

  const value: StoreValue = {
    ready, cloud: cloudOn, supabaseConfigured: SUPABASE_READY, session, me, meRow,
    entries, metrics, metricPoints, profiles, allProfiles, teams, events, feed, comments, endorsements,
    stats, now, theme, inviteLink,
    onboard, signOut, setTheme, getProfile,
    saveEntry, deleteEntry, saveMetric, deleteMetric, addMetricPoint, updateMe,
    createTeam, joinTeam, leaveTeam, createEvent, rsvp, cheer, pushFeed, addComment, endorse,
    sendEmailOtp, verifyEmailOtp,
  }
  return <Ctx value={value}>{children}</Ctx>
}

function uniq<T>(a: T[]): T[] { return [...new Set(a)] }
function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map(a.map((x) => [x.id, x]))
  for (const x of b) map.set(x.id, x)
  return [...map.values()]
}
export { tierForIncome }

function zhAuth(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('otp') || m.includes('token')) return '验证码错误或已过期'
  if (m.includes('rate') || m.includes('limit')) return '太频繁了，稍后再试'
  if (m.includes('email')) return '邮箱格式有误'
  return msg
}
