import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Profile, PlayerStats } from '../types'
import { titleMeta } from '../lib/catalog'
import { nextTier } from '../lib/tiers'
import { wan, pct } from '../lib/format'
import { Sheet, Button } from './ui'
import { IconCheck, IconLink } from './icons'

const W = 1080
const H = 1600

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** A gorgeous, self-contained 战报卡 as an SVG string (rasterized to PNG on save/share). */
export function buildCardSVG(p: Profile, s: PlayerStats): string {
  const t = s.currentTier
  const nt = nextTier(t)
  const [g0, g1] = t.gradient
  const season = `S${new Date().getMonth() + 1}`

  // wealth curve
  const series = s.monthlySeries
  const cx0 = 120, cy0 = 1240, cw = 840, ch = 108
  let curve = ''
  let dots = ''
  if (series.length > 1) {
    const max = Math.max(10000, ...series.map((m) => m.income))
    const n = series.length
    const X = (i: number) => cx0 + (i / (n - 1)) * cw
    const Y = (v: number) => cy0 + (1 - v / max) * ch
    const pts = series.map((m, i) => `${X(i).toFixed(1)},${Y(m.income).toFixed(1)}`).join(' ')
    curve = `<polygon points="${cx0},${cy0 + ch} ${pts} ${cx0 + cw},${cy0 + ch}" fill="url(#curveFill)"/>
      <polyline points="${pts}" fill="none" stroke="${g0}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`
    dots = series.map((m, i) => m.isBreakthrough
      ? `<circle cx="${X(i).toFixed(1)}" cy="${Y(m.income).toFixed(1)}" r="9" fill="#f5c542" stroke="#fff3c4" stroke-width="2"/>` : '').join('')
  }

  const stats = [
    ['势能', pct(s.momentum), s.momentum >= 0 ? '#30d158' : '#ff453a'],
    ['连续', `${s.streakDays}天`, '#f5c542'],
    ['诚信', String(s.integrity), '#0a84ff'],
    ['巅峰', s.peakTier.name, g1],
  ]
  const statCx = [168, 414, 666, 912]

  const titles = s.titles.slice(0, 3).map((id) => titleMeta(id)).filter(Boolean)
  const tW = 300
  const titleSvg = titles.map((m, i) => {
    const x = W / 2 - (titles.length * tW) / 2 + i * tW + 12
    return `<g transform="translate(${x},1404)">
      <rect width="${tW - 24}" height="62" rx="31" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
      <text x="${(tW - 24) / 2}" y="40" text-anchor="middle" font-size="28" fill="#e7e7ea">${m!.emoji} ${esc(m!.name)}</text></g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, 'PingFang SC', 'Segoe UI', system-ui, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141420"/><stop offset="1" stop-color="#08080c"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.28" r="0.6"><stop offset="0" stop-color="${g0}" stop-opacity="0.42"/><stop offset="1" stop-color="${g0}" stop-opacity="0"/></radialGradient>
    <linearGradient id="tier" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g0}"/><stop offset="1" stop-color="${g1}"/></linearGradient>
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f7d774"/><stop offset="0.5" stop-color="#fff3c4"/><stop offset="1" stop-color="#e0a92e"/></linearGradient>
    <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g0}" stop-opacity="0.35"/><stop offset="1" stop-color="${g0}" stop-opacity="0"/></linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="52" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>

  <!-- header -->
  <text x="72" y="112" font-size="46" font-weight="800" fill="#fff">搞钱局</text>
  <text x="232" y="112" font-size="30" fill="rgba(255,255,255,0.5)">· 财富段位赛</text>
  <g transform="translate(${W - 72 - 150},64)"><rect width="150" height="56" rx="28" fill="rgba(255,255,255,0.08)"/><text x="75" y="37" text-anchor="middle" font-size="26" fill="#f5c542">${season} 赛季</text></g>

  <!-- avatar + name -->
  <circle cx="150" cy="256" r="70" fill="rgba(255,255,255,0.06)" stroke="${t.color}" stroke-width="3"/>
  <text x="150" y="284" text-anchor="middle" font-size="76">${esc(p.avatar)}</text>
  <text x="252" y="240" font-size="54" font-weight="800" fill="#fff">${esc(p.name)}</text>
  <text x="252" y="292" font-size="30" fill="rgba(255,255,255,0.5)">${esc(p.city ?? '搞钱人')} · 入局 ${Math.max(1, Math.round((Date.now() - +new Date(p.joinedAt)) / 86400000))} 天</text>

  <!-- hero tier -->
  <rect x="410" y="360" width="260" height="260" rx="60" fill="url(#tier)" filter="url(#soft)" opacity="0.55"/>
  <rect x="410" y="360" width="260" height="260" rx="60" fill="url(#tier)"/>
  <text x="540" y="558" text-anchor="middle" font-size="150">${esc(t.emoji)}</text>
  <text x="540" y="712" text-anchor="middle" font-size="70" font-weight="800" fill="#fff">${esc(t.name)} <tspan font-size="38" font-weight="500" fill="rgba(255,255,255,0.55)">${esc(t.rankLabel)}</tspan></text>
  <text x="540" y="760" text-anchor="middle" font-size="30" fill="rgba(255,255,255,0.55)">${esc(t.subtitle)}</text>

  <!-- big number -->
  <text x="540" y="852" text-anchor="middle" font-size="30" fill="rgba(255,255,255,0.5)" letter-spacing="4">本 月 进 账</text>
  <text x="540" y="972" text-anchor="middle" font-size="128" font-weight="800" fill="url(#foil)">${esc(wan(s.monthIncome))}</text>

  <!-- progress -->
  <rect x="200" y="1024" width="680" height="16" rx="8" fill="rgba(255,255,255,0.1)"/>
  <rect x="200" y="1024" width="${Math.max(6, 680 * s.tierProgress).toFixed(0)}" height="16" rx="8" fill="url(#tier)"/>
  <text x="540" y="1078" text-anchor="middle" font-size="26" fill="rgba(255,255,255,0.5)">${nt ? `距「${esc(nt.name)}」还差 ${esc(wan(Math.max(0, nt.threshold - s.monthIncome)))}/月` : '👑 已达顶级 · 造风者'}</text>

  <!-- stats -->
  ${stats.map((st, i) => `<text x="${statCx[i]}" y="1168" text-anchor="middle" font-size="46" font-weight="800" fill="${st[2]}">${esc(st[1])}</text>
    <text x="${statCx[i]}" y="1210" text-anchor="middle" font-size="26" fill="rgba(255,255,255,0.45)">${st[0]}</text>`).join('')}

  <!-- wealth curve -->
  ${curve}${dots}
  <text x="120" y="1230" font-size="24" fill="rgba(255,255,255,0.4)">财富曲线 · 🔥爆发 ${s.breakthroughs.length} 次</text>

  <!-- titles -->
  ${titleSvg}

  <!-- footer -->
  <line x1="72" y1="1502" x2="1008" y2="1502" stroke="rgba(255,255,255,0.08)"/>
  <text x="72" y="1556" font-size="30" font-weight="700" fill="#fff">🎲 一起搞钱</text>
  <text x="1008" y="1556" text-anchor="end" font-size="26" fill="rgba(255,255,255,0.4)">搜索「搞钱局」· 真实记录你的财富段位</text>
</svg>`
}

function svgToUrl(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
async function rasterize(svg: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      const ctx = c.getContext('2d')
      if (!ctx) return reject()
      ctx.drawImage(img, 0, 0, W, H)
      c.toBlob((b) => (b ? resolve(b) : reject()), 'image/png')
    }
    img.onerror = reject
    img.src = svgToUrl(svg)
  })
}

export function ShareSheet({ onClose, headline }: { onClose: () => void; headline?: string }) {
  const { meRow, stats, inviteLink } = useStore()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const svg = useMemo(() => (meRow && stats ? buildCardSVG(meRow, stats) : ''), [meRow, stats])
  if (!meRow || !stats) return null

  async function save() {
    setBusy(true)
    try {
      const blob = await rasterize(svg)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob); a.download = '搞钱局-战报.png'; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    } catch { /* ignore */ }
    setBusy(false)
  }
  async function share() {
    setBusy(true)
    try {
      const blob = await rasterize(svg)
      const file = new File([blob], '搞钱局-战报.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean }
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: '我的搞钱局战报', text: `我在搞钱局冲到「${stats!.currentTier.name}」了，一起来搞钱 👉 ${inviteLink}` })
      } else {
        await save()
      }
    } catch { /* user cancelled */ }
    setBusy(false)
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* ignore */ }
  }

  return (
    <Sheet open onClose={onClose} title={headline ?? '晒战报'}>
      <div className="rounded-3xl overflow-hidden shadow-pop border hairline">
        <img src={svgToUrl(svg)} alt="战报卡" className="w-full block" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button variant="gold" onClick={share} disabled={busy} className="w-full">{busy ? '生成中…' : '分享战报'}</Button>
        <Button variant="ghost" onClick={save} disabled={busy} className="w-full">保存图片</Button>
      </div>
      <button onClick={copyLink} className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-accent py-2">
        {copied ? <><IconCheck /> 已复制邀请链接</> : <><IconLink /> 复制邀请链接</>}
      </button>
      <p className="text-xs text-faint text-center mt-1">把战报发到朋友圈 / 小红书 / 群里，喊搞钱搭子一起上分</p>
    </Sheet>
  )
}
