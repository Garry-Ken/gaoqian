// ============================================================
// Supabase mirror. Only active when SUPABASE_READY && a session exists.
// Mirrors the same shapes the local store uses:
//   profiles / entries / metrics / metric_points / teams / events /
//   feed / endorsements  (see supabase/schema.sql)
// Every call is defensive: on any failure the local-first app keeps working.
// ============================================================
import { supabase, SUPABASE_READY } from './supabase'
import type {
  Profile, Entry, CustomMetric, MetricPoint, Team, MeetEvent, FeedItem, Endorsement, Comment,
} from '../types'
import type { World } from './seed'

export const cloudActive = () => SUPABASE_READY && !!supabase

async function rows<T>(table: string): Promise<T[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from(table).select('data')
  if (error || !data) return []
  return data.map((r: { data: T }) => r.data)
}

/** Pull the shared world (everyone's public profile + teams/events/feed). */
export async function pullWorld(): Promise<Partial<World> | null> {
  if (!cloudActive()) return null
  try {
    const [profiles, teams, events, feed, comments, endorsements] = await Promise.all([
      rows<Profile>('profiles'), rows<Team>('teams'), rows<MeetEvent>('events'),
      rows<FeedItem>('feed'), rows<Comment>('comments'), rows<Endorsement>('endorsements'),
    ])
    return { profiles, teams, events, feed, comments, endorsements }
  } catch {
    return null
  }
}

export async function pullMine(userId: string): Promise<{ entries: Entry[]; metrics: CustomMetric[]; points: MetricPoint[] } | null> {
  if (!cloudActive() || !supabase) return null
  try {
    const [e, m, p] = await Promise.all([
      supabase.from('entries').select('data').eq('owner_id', userId),
      supabase.from('metrics').select('data').eq('owner_id', userId),
      supabase.from('metric_points').select('data').eq('owner_id', userId),
    ])
    return {
      entries: (e.data ?? []).map((r) => r.data),
      metrics: (m.data ?? []).map((r) => r.data),
      points: (p.data ?? []).map((r) => r.data),
    }
  } catch {
    return null
  }
}

type Rec = { id: string; ownerId?: string }
async function upsert(table: string, record: Rec, ownerKey = true) {
  if (!cloudActive() || !supabase) return
  const row: Record<string, unknown> = { id: record.id, data: record, updated_at: new Date().toISOString() }
  if (ownerKey && record.ownerId) row.owner_id = record.ownerId
  try { await supabase.from(table).upsert(row, { onConflict: 'id' }) } catch { /* ignore */ }
}
async function del(table: string, id: string) {
  if (!cloudActive() || !supabase) return
  try { await supabase.from(table).delete().eq('id', id) } catch { /* ignore */ }
}

export const cloud = {
  saveProfile: (p: Profile) => upsert('profiles', { ...p, ownerId: p.id }),
  saveEntry: (e: Entry) => upsert('entries', e),
  deleteEntry: (id: string) => del('entries', id),
  saveMetric: (m: CustomMetric) => upsert('metrics', m),
  deleteMetric: (id: string) => del('metrics', id),
  savePoint: (p: MetricPoint) => upsert('metric_points', p),
  saveTeam: (t: Team) => upsert('teams', { ...t, ownerId: t.ownerId }),
  saveEvent: (e: MeetEvent) => upsert('events', { ...e, ownerId: e.hostId }),
  saveFeed: (f: FeedItem) => upsert('feed', { ...f, ownerId: f.actorId }),
  saveComment: (c: Comment) => upsert('comments', { ...c, ownerId: c.authorId }),
  saveEndorsement: (e: Endorsement) => upsert('endorsements', { ...e, ownerId: e.fromId }),
}
