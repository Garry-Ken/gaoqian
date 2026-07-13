import { useState } from 'react'
import { useStore } from '../store'
import type { CustomMetric } from '../types'
import { metricValue, dateLabel } from '../lib/format'
import { Sheet, Button, cx } from './ui'
import { IconTrash } from './icons'

const KINDS: { id: CustomMetric['kind']; label: string; unit: string }[] = [
  { id: 'count', label: '数量', unit: '个' }, { id: 'currency', label: '金额', unit: '¥' },
  { id: 'percent', label: '百分比', unit: '%' }, { id: 'number', label: '数值', unit: '' },
]
const PRESETS = [
  { name: '粉丝数', emoji: '👥', kind: 'count' as const, unit: '人', color: '#ff375f' },
  { name: 'GMV', emoji: '🛒', kind: 'currency' as const, unit: '¥', color: '#ff9f0a' },
  { name: 'MRR', emoji: '🔁', kind: 'currency' as const, unit: '¥', color: '#30d158' },
  { name: '付费用户', emoji: '💳', kind: 'count' as const, unit: '人', color: '#0a84ff' },
  { name: '存款', emoji: '🏦', kind: 'currency' as const, unit: '¥', color: '#34d9c9' },
  { name: '净资产', emoji: '💎', kind: 'currency' as const, unit: '¥', color: '#5e5ce6' },
  { name: '时薪', emoji: '⏱️', kind: 'currency' as const, unit: '¥/h', color: '#bf5af2' },
  { name: '转化率', emoji: '📈', kind: 'percent' as const, unit: '%', color: '#63e6be' },
]

export function MetricSheet({ open, metric, onClose }: { open: boolean; metric?: CustomMetric; onClose: () => void }) {
  const store = useStore()
  const editing = !!metric
  const [name, setName] = useState(metric?.name ?? '')
  const [emoji, setEmoji] = useState(metric?.emoji ?? '📊')
  const [kind, setKind] = useState<CustomMetric['kind']>(metric?.kind ?? 'count')
  const [unit, setUnit] = useState(metric?.unit ?? '个')
  const [color, setColor] = useState(metric?.color ?? '#0a84ff')
  const [value, setValue] = useState('')

  const points = metric ? store.metricPoints.filter((p) => p.metricId === metric.id).sort((a, b) => +new Date(b.at) - +new Date(a.at)) : []

  function create() {
    if (!name.trim()) return
    store.saveMetric({ name: name.trim(), emoji, kind, unit, color, direction: 'up' })
    onClose()
  }
  function addPoint() {
    const v = Number(value)
    if (!metric || isNaN(v)) return
    store.addMetricPoint(metric.id, v)
    setValue('')
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? metric!.name : '新建数据指标'}>
      {!editing && (
        <>
          <div className="text-xs text-muted mb-2">选个常用的，或自己建</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => { setName(p.name); setEmoji(p.emoji); setKind(p.kind); setUnit(p.unit); setColor(p.color) }}
                className={cx('flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-xs', name === p.name ? 'border-accent bg-accent/10' : 'hairline text-muted')}>
                <span className="text-xl">{p.emoji}</span><span className="truncate w-full text-center">{p.name}</span>
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 2))} className="input !w-16 text-center text-xl" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="指标名称" className="input" />
            </div>
            <div className="seg">
              {KINDS.map((k) => (
                <button key={k.id} onClick={() => { setKind(k.id); if (k.unit) setUnit(k.unit) }} className={cx('seg-item', kind === k.id && 'seg-item-active')}>{k.label}</button>
              ))}
            </div>
            <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="单位，如 人 / ¥ / %" className="input" />
          </div>
          <Button onClick={create} disabled={!name.trim()} className="w-full mt-5">创建指标</Button>
        </>
      )}

      {editing && (
        <>
          <div className="flex gap-2">
            <input inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.-]/g, ''))} placeholder={`记录当前 ${metric!.name}`} className="input num text-xl" autoFocus />
            <Button onClick={addPoint} disabled={!value}>记录</Button>
          </div>
          <div className="mt-4 space-y-1.5 max-h-64 overflow-y-auto no-scrollbar">
            {points.length === 0 && <div className="text-sm text-faint text-center py-6">还没有数据点，记录第一个吧</div>}
            {points.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-subtle">
                <span className="num font-semibold">{metricValue(p.value, metric!.kind, metric!.unit)}</span>
                <span className="text-xs text-faint">{dateLabel(p.at)}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { store.deleteMetric(metric!.id); onClose() }} className="w-full mt-5 text-loss text-sm flex items-center justify-center gap-1.5 py-2"><IconTrash /> 删除指标</button>
        </>
      )}
    </Sheet>
  )
}
