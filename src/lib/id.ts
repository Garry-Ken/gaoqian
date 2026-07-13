// Stable-ish unique ids without a dependency.
export function uid(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 8)
  const t = Date.now().toString(36).slice(-5)
  return `${prefix}${t}${rnd}`
}

// Deterministic seeded RNG (mulberry32) so the demo world is stable across reloads.
export function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}
export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i)
}
