import { useRef, useState } from 'react'
import { useStore } from '../store'
import type { Entry, EntryType, IncomeSourceId, AttemptCategoryId, VentureStatus, ProofLevel, Proof } from '../types'
import { INCOME_SOURCES, ATTEMPT_CATEGORIES } from '../lib/catalog'
import { uid } from '../lib/id'
import { Sheet, Button, cx } from './ui'
import { IconCamera, IconClose, IconLink } from './icons'

const TYPES: { id: EntryType; label: string; emoji: string; hint: string }[] = [
  { id: 'income', label: '收入', emoji: '💰', hint: '一笔真实进账' },
  { id: 'attempt', label: '尝试', emoji: '🧪', hint: '开个搞钱副本' },
  { id: 'action', label: '工作量', emoji: '🔨', hint: '今天做了啥' },
  { id: 'milestone', label: '里程碑', emoji: '🚩', hint: '值得记住的一刻' },
]
const STATUSES: { id: VentureStatus; label: string }[] = [
  { id: 'idea', label: '构思' }, { id: 'active', label: '进行中' }, { id: 'working', label: '已见效' },
  { id: 'paused', label: '暂停' }, { id: 'done', label: '完成' }, { id: 'abandoned', label: '放弃' },
]

async function downscale(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file) })
  return new Promise<string>((res) => {
    const img = new Image()
    img.onload = () => {
      const max = 900
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0, c.width, c.height)
      res(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => res(dataUrl)
    img.src = dataUrl
  })
}

export function EntrySheet({ open, onClose, edit, defaultType, ventureId }: { open: boolean; onClose: () => void; edit?: Entry; defaultType?: EntryType; ventureId?: string }) {
  const store = useStore()
  const [type, setType] = useState<EntryType>(edit?.type ?? defaultType ?? 'income')
  const [title, setTitle] = useState(edit?.title ?? '')
  const [amount, setAmount] = useState(edit?.amount ? String(edit.amount) : '')
  const [source, setSource] = useState<IncomeSourceId>(edit?.source ?? 'side')
  const [recurring, setRecurring] = useState(edit?.recurring ?? false)
  const [category, setCategory] = useState<AttemptCategoryId>(edit?.category ?? 'side')
  const [status, setStatus] = useState<VentureStatus>(edit?.status ?? 'active')
  const [investMoney, setInvestMoney] = useState(edit?.investMoney ? String(edit.investMoney) : '')
  const [investHours, setInvestHours] = useState(edit?.investHours ? String(edit.investHours) : '')
  const [lesson, setLesson] = useState(edit?.lesson ?? '')
  const [effort, setEffort] = useState(edit?.effort ? String(edit.effort) : '')
  const [effortUnit, setEffortUnit] = useState<'hour' | 'point' | 'task'>(edit?.effortUnit ?? 'hour')
  const [note, setNote] = useState(edit?.note ?? '')
  const [date, setDate] = useState((edit?.occurredAt ?? new Date().toISOString()).slice(0, 10))
  const [proofs, setProofs] = useState<Proof[]>(edit?.proofs ?? [])
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => { onClose() }

  async function onFiles(files: FileList | null) {
    if (!files) return
    const added: Proof[] = []
    for (const f of Array.from(files).slice(0, 4)) {
      const url = await downscale(f)
      added.push({ id: uid('pf_'), kind: 'image', url, addedAt: new Date().toISOString() })
    }
    setProofs((p) => [...p, ...added])
  }
  function addLink() {
    const url = prompt('粘贴凭证链接（如平台后台截图链接）')
    if (url) setProofs((p) => [...p, { id: uid('pf_'), kind: 'link', url, addedAt: new Date().toISOString() }])
  }

  function save() {
    const proofLevel: ProofLevel = proofs.length >= 2 ? 'multi' : proofs.length === 1 ? 'screenshot' : 'none'
    const occurredAt = new Date(date + 'T12:00:00').toISOString()
    const common = { id: edit?.id, title: title.trim(), note: note.trim() || undefined, occurredAt, ventureId: ventureId ?? edit?.ventureId, proofs }
    if (type === 'income') {
      const amt = Math.round(Number(amount) || 0)
      if (amt <= 0) return
      store.saveEntry({ ...common, type, title: common.title || INCOME_SOURCES.find((s) => s.id === source)!.label, amount: amt, source, recurring, proofLevel })
    } else if (type === 'attempt') {
      if (!common.title) return
      store.saveEntry({ ...common, type, category, status, investMoney: Number(investMoney) || undefined, investHours: Number(investHours) || undefined, lesson: lesson.trim() || undefined })
    } else if (type === 'action') {
      if (!common.title) return
      store.saveEntry({ ...common, type, effort: Number(effort) || 1, effortUnit })
    } else {
      if (!common.title) return
      store.saveEntry({ ...common, type })
    }
    reset()
  }

  return (
    <Sheet open={open} onClose={onClose} title={edit ? '编辑记录' : '记一笔'}>
      {!edit && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {TYPES.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)}
              className={cx('flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-xs transition', type === t.id ? 'border-accent bg-accent/10 text-fg' : 'hairline text-muted')}>
              <span className="text-xl">{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>
      )}

      {type === 'income' && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted">金额 (¥)</label>
            <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" className="input num text-3xl font-bold mt-1" autoFocus />
          </div>
          <ChipRow label="来源" items={INCOME_SOURCES} value={source} onChange={setSource} />
          <textarea value={title} onChange={(e) => setTitle(e.target.value)} placeholder="备注这笔怎么来的（可选）" className="input min-h-[44px]" rows={1} />
          <ProofRow proofs={proofs} onAdd={() => fileRef.current?.click()} onLink={addLink} onRemove={(id) => setProofs((p) => p.filter((x) => x.id !== id))} />
          <ToggleRow label="每月固定进账" value={recurring} onChange={setRecurring} />
          <DateRow date={date} setDate={setDate} />
        </div>
      )}

      {type === 'attempt' && (
        <div className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="这个尝试叫什么？如「做一个AI小工具」" className="input" autoFocus />
          <ChipRow label="类型" items={ATTEMPT_CATEGORIES} value={category} onChange={setCategory} />
          <div>
            <label className="text-xs text-muted">进展</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {STATUSES.map((s) => (
                <button key={s.id} onClick={() => setStatus(s.id)} className={cx('pill', status === s.id ? 'bg-accent text-white' : 'bg-subtle text-muted')}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="已投入(¥)" value={investMoney} onChange={setInvestMoney} numeric />
            <LabeledInput label="已投入(小时)" value={investHours} onChange={setInvestHours} numeric />
          </div>
          <textarea value={lesson} onChange={(e) => setLesson(e.target.value)} placeholder="踩过的坑 / 学到的东西（失败也值钱）" className="input" rows={2} />
          <DateRow date={date} setDate={setDate} />
        </div>
      )}

      {type === 'action' && (
        <div className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="今天做了什么？如「谈了3个客户」" className="input" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <LabeledInput label="投入量" value={effort} onChange={setEffort} numeric />
            <div>
              <label className="text-xs text-muted">单位</label>
              <div className="seg mt-1.5">
                {(['hour', 'point', 'task'] as const).map((u) => (
                  <button key={u} onClick={() => setEffortUnit(u)} className={cx('seg-item', effortUnit === u && 'seg-item-active')}>{u === 'hour' ? '小时' : u === 'point' ? '强度' : '件数'}</button>
                ))}
              </div>
            </div>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="备注（可选）" className="input" rows={2} />
          <DateRow date={date} setDate={setDate} />
        </div>
      )}

      {type === 'milestone' && (
        <div className="space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="记住这一刻，如「第一次月入过万」" className="input" autoFocus />
          <ProofRow proofs={proofs} onAdd={() => fileRef.current?.click()} onLink={addLink} onRemove={(id) => setProofs((p) => p.filter((x) => x.id !== id))} />
          <DateRow date={date} setDate={setDate} />
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <div className="flex gap-3 mt-6">
        {edit && <Button variant="line" onClick={() => { store.deleteEntry(edit.id); onClose() }} className="!px-4"><IconClose /></Button>}
        <Button onClick={save} className="flex-1">{edit ? '保存' : '记下来'}</Button>
      </div>
    </Sheet>
  )
}

function ChipRow<T extends string>({ label, items, value, onChange }: { label: string; items: { id: T; label: string; emoji: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {items.map((s) => (
          <button key={s.id} onClick={() => onChange(s.id)} className={cx('pill', value === s.id ? 'bg-accent text-white' : 'bg-subtle text-muted')}>
            <span>{s.emoji}</span>{s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
function ProofRow({ proofs, onAdd, onLink, onRemove }: { proofs: Proof[]; onAdd: () => void; onLink: () => void; onRemove: (id: string) => void }) {
  return (
    <div>
      <label className="text-xs text-muted flex items-center gap-1">凭证 <span className="text-faint">· 有图更容易上真实榜</span></label>
      <div className="flex gap-2 mt-1.5 flex-wrap">
        {proofs.map((p) => (
          <div key={p.id} className="relative w-14 h-14 rounded-xl bg-subtle overflow-hidden flex items-center justify-center">
            {p.kind === 'image' ? <img src={p.url} className="w-full h-full object-cover" /> : <IconLink />}
            <button onClick={() => onRemove(p.id)} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-loss text-white flex items-center justify-center text-[10px]"><IconClose /></button>
          </div>
        ))}
        <button onClick={onAdd} className="w-14 h-14 rounded-xl border hairline flex items-center justify-center text-muted text-lg"><IconCamera /></button>
        <button onClick={onLink} className="w-14 h-14 rounded-xl border hairline flex items-center justify-center text-muted text-lg"><IconLink /></button>
      </div>
    </div>
  )
}
function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <button onClick={() => onChange(!value)} className={cx('w-[51px] h-[31px] rounded-full transition-colors relative', value ? 'bg-gain' : 'bg-subtle')}>
        <span className={cx('absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow transition-all', value ? 'left-[22px]' : 'left-[2px]')} />
      </button>
    </div>
  )
}
function DateRow({ date, setDate }: { date: string; setDate: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">发生日期</span>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input !w-auto !py-2 text-sm" />
    </div>
  )
}
function LabeledInput({ label, value, onChange, numeric }: { label: string; value: string; onChange: (v: string) => void; numeric?: boolean }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input inputMode={numeric ? 'numeric' : 'text'} value={value} onChange={(e) => onChange(numeric ? e.target.value.replace(/[^\d.]/g, '') : e.target.value)} className="input num mt-1 !py-2.5" placeholder="0" />
    </div>
  )
}
