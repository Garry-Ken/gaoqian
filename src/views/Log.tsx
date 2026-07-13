import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Entry, CustomMetric } from '../types'
import { sourceMeta, attemptMeta } from '../lib/catalog'
import { wan, yuan, dateLabel, metricValue } from '../lib/format'
import { EntrySheet } from '../components/EntrySheet'
import { MetricSheet } from '../components/MetricSheet'
import { Segmented, Pill, Button, EmptyState } from '../components/ui'
import { Sparkline as Spark } from '../components/charts'
import { IconCamera, IconPlus, IconChevron } from '../components/icons'

const TYPE_META: Record<Entry['type'], { emoji: string; label: string }> = {
  income: { emoji: '💰', label: '收入' }, attempt: { emoji: '🧪', label: '尝试' },
  action: { emoji: '🔨', label: '工作量' }, milestone: { emoji: '🚩', label: '里程碑' },
}
const STATUS_LABEL: Record<string, string> = { idea: '构思', active: '进行中', working: '已见效', paused: '暂停', done: '完成', abandoned: '放弃' }

export function Log(_: { onOpenProfile: (id: string) => void }) {
  const { entries, metrics, metricPoints } = useStore()
  const [sub, setSub] = useState<'timeline' | 'venture' | 'data'>('timeline')
  const [edit, setEdit] = useState<Entry | null>(null)
  const [metricEdit, setMetricEdit] = useState<CustomMetric | 'new' | null>(null)

  const sorted = useMemo(() => [...entries].sort((a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt)), [entries])
  const ventures = useMemo(() => sorted.filter((e) => e.type === 'attempt'), [sorted])
  const groups = useMemo(() => {
    const m = new Map<string, Entry[]>()
    for (const e of sorted) { const k = e.occurredAt.slice(0, 10); (m.get(k) ?? m.set(k, []).get(k)!).push(e) }
    return [...m.entries()]
  }, [sorted])

  return (
    <div className="space-y-4 pb-4">
      <Segmented options={[{ id: 'timeline', label: '时间线' }, { id: 'venture', label: '副本' }, { id: 'data', label: '数据' }]} value={sub} onChange={setSub} />

      {sub === 'timeline' && (
        groups.length === 0 ? (
          <EmptyState emoji="📝" title="还没有记录" sub="点右下角的 + 记下第一笔收入或尝试。真实记录是这一切的起点。" />
        ) : (
          <div className="space-y-4">
            {groups.map(([day, list]) => (
              <div key={day}>
                <div className="text-xs text-faint px-1 mb-1.5">{dateLabel(day + 'T12:00:00')}</div>
                <div className="space-y-2">
                  {list.map((e) => <EntryRow key={e.id} e={e} onClick={() => setEdit(e)} />)}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {sub === 'venture' && (
        ventures.length === 0 ? (
          <EmptyState emoji="🧪" title="还没有副本" sub="每一次搞钱尝试都是一个副本——做产品、接活、搞副业。失败也值钱，记下来复盘。" action={<Button onClick={() => setEdit({ type: 'attempt' } as Entry)}>开个副本</Button>} />
        ) : (
          <div className="space-y-2.5">
            {ventures.map((v) => <VentureCard key={v.id} v={v} incomeSum={entries.filter((e) => e.type === 'income' && e.ventureId === v.id).reduce((s, e) => s + (e.amount ?? 0), 0)} onClick={() => setEdit(v)} />)}
          </div>
        )
      )}

      {sub === 'data' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm text-muted">自定义数据 · 记录任何你在乎的指标</div>
            <button onClick={() => setMetricEdit('new')} className="text-accent text-sm flex items-center gap-0.5"><IconPlus /> 新指标</button>
          </div>
          {metrics.length === 0 ? (
            <EmptyState emoji="📊" title="添加你的搞钱指标" sub="粉丝数、GMV、MRR、客户数、存款、时薪……任何能验证增长的数据，都能追踪。" action={<Button onClick={() => setMetricEdit('new')}>添加指标</Button>} />
          ) : metrics.map((m) => {
            const pts = metricPoints.filter((p) => p.metricId === m.id).sort((a, b) => +new Date(a.at) - +new Date(b.at))
            const latest = pts[pts.length - 1]
            const first = pts[0]
            const delta = latest && first ? latest.value - first.value : 0
            return (
              <button key={m.id} onClick={() => setMetricEdit(m)} className="card card-tap w-full p-4 flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl" style={{ background: (m.color ?? '#0a84ff') + '22' }}>{m.emoji ?? '📊'}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{m.name}</div>
                  <div className="num text-lg font-bold">{latest ? metricValue(latest.value, m.kind, m.unit) : '—'}</div>
                </div>
                {pts.length >= 2 && <Spark points={pts.map((p) => p.value)} up={m.direction === 'up' ? delta >= 0 : delta <= 0} />}
                <IconChevron className="text-faint" />
              </button>
            )
          })}
        </div>
      )}

      {edit && <EntrySheet open onClose={() => setEdit(null)} edit={edit.id ? edit : undefined} defaultType={edit.type} />}
      {metricEdit && <MetricSheet open metric={metricEdit === 'new' ? undefined : metricEdit} onClose={() => setMetricEdit(null)} />}
    </div>
  )
}

function EntryRow({ e, onClick }: { e: Entry; onClick: () => void }) {
  const meta = TYPE_META[e.type]
  const sub = e.type === 'income' ? sourceMeta(e.source).label
    : e.type === 'attempt' ? `${attemptMeta(e.category).label} · ${STATUS_LABEL[e.status ?? 'active']}`
    : e.type === 'action' ? `投入 ${e.effort ?? 0}${e.effortUnit === 'hour' ? '小时' : e.effortUnit === 'task' ? '件' : '点'}`
    : '里程碑'
  return (
    <button onClick={onClick} className="card card-tap w-full p-3 flex items-center gap-3 text-left">
      <div className="w-10 h-10 rounded-2xl bg-subtle flex items-center justify-center text-lg shrink-0">{meta.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{e.title || meta.label}</div>
        <div className="text-xs text-muted truncate flex items-center gap-1.5">{sub}{e.proofs.length > 0 && <span className="text-accent inline-flex items-center gap-0.5"><IconCamera />{e.proofs.length}</span>}{e.updatedAt && <span className="text-faint">· 已更新</span>}</div>
      </div>
      {e.type === 'income' && <div className="num text-base font-bold text-gain shrink-0">{yuan(e.amount ?? 0, true)}</div>}
    </button>
  )
}

function VentureCard({ v, incomeSum, onClick }: { v: Entry; incomeSum: number; onClick: () => void }) {
  const m = attemptMeta(v.category)
  const tone = v.status === 'working' || v.status === 'done' ? 'gain' : v.status === 'abandoned' ? 'loss' : 'default'
  return (
    <button onClick={onClick} className="card card-tap w-full p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: m.color + '22' }}>{m.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{v.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <Pill tone={tone as 'gain' | 'loss' | 'default'}>{STATUS_LABEL[v.status ?? 'active']}</Pill>
            <span className="text-xs text-muted">{m.label}</span>
          </div>
          {v.lesson && <div className="text-xs text-muted mt-2 line-clamp-2">💡 {v.lesson}</div>}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t hairline text-xs">
        {(v.investMoney || v.investHours) ? <span className="text-muted">投入 {v.investMoney ? wan(v.investMoney) : ''}{v.investHours ? ` · ${v.investHours}h` : ''}</span> : <span className="text-faint">未记录投入</span>}
        <span className="ml-auto num font-semibold text-gain">产出 {wan(incomeSum)}</span>
      </div>
    </button>
  )
}
