// Thin localStorage layer. Every write degrades silently (private mode / quota).
const PREFIX = 'gaoqian:'

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

export const KEYS = {
  session: 'session.v1',
  profiles: 'world.profiles.v1',
  teams: 'world.teams.v1',
  events: 'world.events.v1',
  feed: 'world.feed.v1',
  comments: 'world.comments.v1',
  endorsements: 'world.endorsements.v1',
  entries: 'me.entries.v1',
  metrics: 'me.metrics.v1',
  metricPoints: 'me.metricPoints.v1',
  seeded: 'world.seeded.v3',
  theme: 'pref.theme.v1',
  onboarded: 'pref.onboarded.v1',
} as const
