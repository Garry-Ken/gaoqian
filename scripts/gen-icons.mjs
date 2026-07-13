// Generate PNG PWA icons from public/icon.svg. Run: npm run icons
// Degrades gracefully if sharp is unavailable (SVG icon still works for install).
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

async function main() {
  let sharp
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('[icons] sharp not installed — skipping PNG generation (SVG icon still ships).')
    return
  }
  const svg = await readFile(join(root, 'icon.svg'))
  const targets = [
    ['pwa-192.png', 192, false],
    ['pwa-512.png', 512, false],
    ['apple-touch-icon.png', 180, false],
    ['pwa-maskable-512.png', 512, true],
  ]
  for (const [name, size, maskable] of targets) {
    let img = sharp(svg, { density: 384 }).resize(size, size)
    if (maskable) {
      // maskable needs safe padding: render inner at 78% on a solid bg
      const inner = Math.round(size * 0.78)
      const pad = Math.round((size - inner) / 2)
      img = sharp({
        create: { width: size, height: size, channels: 4, background: '#0b0b0f' },
      }).composite([{ input: await sharp(svg, { density: 384 }).resize(inner, inner).png().toBuffer(), top: pad, left: pad }])
    }
    await writeFile(join(root, name), await img.png().toBuffer())
    console.log('[icons] wrote', name)
  }
}
main().catch((e) => {
  console.warn('[icons] generation failed:', e.message)
})
