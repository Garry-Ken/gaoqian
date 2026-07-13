import { useState } from 'react'
import { useStore } from '../store'
import { CITIES } from '../lib/catalog'
import { TIERS } from '../lib/tiers'
import { Button, cx } from '../components/ui'
import { wan } from '../lib/format'

const AVATARS = ['🧑‍💻', '🧔', '👩‍💼', '🦄', '🐼', '🥷', '🤖', '🚀', '🎬', '🛒', '📈', '🧑‍🎨', '🦁', '🐯', '🐺', '🦊']
const GOALS = [10000, 30000, 50000, 100000, 300000, 1000000]

export function Onboarding() {
  const { onboard } = useStore()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [city, setCity] = useState('')
  const [goal, setGoal] = useState<number>(30000)

  return (
    <div className="min-h-full flex flex-col p-6 safe-top safe-bottom max-w-md mx-auto w-full">
      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 animate-fade-up">
          <img src="./icon.svg" className="w-24 h-24 rounded-[1.6rem] shadow-pop animate-float" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">搞钱局</h1>
            <p className="text-muted mt-3 leading-relaxed">把真实的搞钱历程<br />玩成一场<span className="text-fg font-semibold">段位赛</span>。</p>
          </div>
          <div className="space-y-2.5 text-left w-full max-w-xs">
            {[
              ['💰', '真实记录', '每一笔收入、每一次尝试，可更新、可验证'],
              ['📈', '冲段位', '月入 1w→3w→5w→10w→30w→100w，允许爆发'],
              ['🏆', '上榜·组队·同城局', '和真实的搞钱人一起玩，线上冲榜、线下开局'],
            ].map(([e, t, d]) => (
              <div key={t} className="card p-3.5 flex items-start gap-3">
                <span className="text-2xl">{e}</span>
                <div><div className="font-semibold text-sm">{t}</div><div className="text-xs text-muted mt-0.5">{d}</div></div>
              </div>
            ))}
          </div>
          <Button onClick={() => setStep(1)} className="w-full max-w-xs mt-2">进入搞钱局 →</Button>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col gap-6 pt-8 animate-fade-up">
          <div>
            <div className="text-eyebrow text-muted tracking-widest uppercase">第 1 步</div>
            <h2 className="text-2xl font-bold mt-1">给自己起个搞钱代号</h2>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => setAvatar(a)} className={cx('aspect-square rounded-2xl text-2xl flex items-center justify-center transition', avatar === a ? 'bg-accent/15 ring-2 ring-accent' : 'bg-subtle')}>{a}</button>
            ))}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="代号 / 昵称，如「深圳搞钱阿强」" className="input text-lg" autoFocus />
          <div>
            <div className="text-sm text-muted mb-2">你在哪座城市？（同城局用得上）</div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto no-scrollbar">
              {CITIES.slice(0, 20).map((c) => (
                <button key={c} onClick={() => setCity(c)} className={cx('pill', city === c ? 'bg-accent text-white' : 'bg-subtle text-muted')}>{c}</button>
              ))}
            </div>
          </div>
          <div className="mt-auto flex gap-3">
            <Button variant="ghost" onClick={() => setStep(0)} className="!px-5">返回</Button>
            <Button onClick={() => setStep(2)} disabled={!name.trim()} className="flex-1">下一步</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col gap-6 pt-8 animate-fade-up">
          <div>
            <div className="text-eyebrow text-muted tracking-widest uppercase">第 2 步</div>
            <h2 className="text-2xl font-bold mt-1">这一季，你想冲到哪个段位？</h2>
            <p className="text-sm text-muted mt-1">目标不是承诺，是方向。随时能改。</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {GOALS.map((g, i) => {
              const tier = TIERS[i + 1]
              return (
                <button key={g} onClick={() => setGoal(g)} className={cx('card p-4 text-left transition', goal === g && 'ring-2 ring-accent')}>
                  <div className="text-2xl">{tier.emoji}</div>
                  <div className="font-bold mt-1">月入 {wan(g, false)}</div>
                  <div className="text-xs text-muted">{tier.name} · {tier.rankLabel}</div>
                </button>
              )
            })}
          </div>
          <div className="mt-auto flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="!px-5">返回</Button>
            <Button variant="gold" onClick={() => onboard({ name: name.trim(), avatar, city: city || undefined, goalMonthly: goal })} className="flex-1">开局 🎲</Button>
          </div>
        </div>
      )}
    </div>
  )
}
