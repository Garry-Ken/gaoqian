import type { SVGProps } from 'react'

// Inline stroke icons — width:1em so they scale with font-size. No icon dep.
const base = (p: SVGProps<SVGSVGElement>) => ({
  width: '1em', height: '1em', viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
})

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></svg>
)
export const IconLog = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 5h16M4 12h16M4 19h10" /></svg>
)
export const IconTrophy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" /><path d="M12 13v4M9 21h6M10 17h4" /></svg>
)
export const IconDice = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" /></svg>
)
export const IconUser = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
)
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>)
export const IconClose = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>)
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 12.5 9 17.5 20 6.5" /></svg>)
export const IconChevron = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>)
export const IconFlame = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c0-1 0-1 .5-2 1.5 1.5 2.5 3.3 2.5 5.5a5 5 0 0 1-10 0C7 12 10 9 12 3Z" /></svg>
)
export const IconBolt = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></svg>)
export const IconShield = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="M9 12l2 2 4-4" /></svg>)
export const IconTrend = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></svg>)
export const IconTarget = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></svg>)
export const IconMap = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 21s7-6.5 7-11a7 7 0 0 0-14 0c0 4.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>)
export const IconCal = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>)
export const IconHeart = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 20s-7-4.6-9-9c-1.2-2.7.4-6 3.5-6 2 0 3.2 1.2 3.5 2 .3-.8 1.5-2 3.5-2 3.1 0 4.7 3.3 3.5 6-2 4.4-8 9-8 9Z" /></svg>)
export const IconEdit = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 20h4L18 10l-4-4L4 16v4Z" /><path d="M13.5 6.5 17.5 10.5" /></svg>)
export const IconTrash = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>)
export const IconCamera = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M4 8h3l1.5-2h7L17 8h3a0 0 0 0 1 0 0v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8Z" /><circle cx="12" cy="13" r="3.2" /></svg>)
export const IconSpark = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /></svg>)
export const IconCoins = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3M15 9.5c3 .4 6 1.6 6 3.5s-3 3.5-6 3.5-6-1.6-6-3.5" /><path d="M9 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-4" /></svg>)
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>)
export const IconGear = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>)
export const IconUsers = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 5.2A3.2 3.2 0 0 1 16 11M17.5 15c2.5.4 4.5 1.9 4.5 5" /></svg>)
export const IconMoon = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" /></svg>)
export const IconSun = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5 6.3 6.3M17.7 17.7l1.8 1.8M19.5 4.5 17.7 6.3M6.3 17.7 4.5 19.5" /></svg>)
export const IconLink = (p: SVGProps<SVGSVGElement>) => (<svg {...base(p)}><path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1" /></svg>)
