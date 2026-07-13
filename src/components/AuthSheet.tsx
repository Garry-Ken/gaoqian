import { useState } from 'react'
import { useStore } from '../store'
import { Sheet, Button, cx } from './ui'
import { IconCheck } from './icons'

export function AuthSheet({ onClose }: { onClose: () => void }) {
  const store = useStore()
  const [tab, setTab] = useState<'email' | 'phone' | 'wechat'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function send() {
    setBusy(true); setMsg('')
    const r = await store.sendEmailOtp(email.trim())
    setBusy(false); setMsg(r.msg)
    if (r.ok) setSent(true)
  }
  async function verify() {
    setBusy(true); setMsg('')
    const r = await store.verifyEmailOtp(email.trim(), code.trim())
    setBusy(false); setMsg(r.msg)
    if (r.ok) onClose()
  }

  return (
    <Sheet open onClose={onClose} title="登录 / 绑定账号">
      {store.cloud && store.session?.provider === 'email' ? (
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✅</div>
          <div className="font-bold">已登录</div>
          <div className="text-sm text-muted mt-1">{store.session.email}</div>
          <Button variant="line" className="mt-5" onClick={() => { store.signOut(); onClose() }}>退出登录</Button>
        </div>
      ) : (
        <>
          <div className="seg mb-4">
            {([['email', '邮箱'], ['phone', '手机'], ['wechat', '微信']] as const).map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} className={cx('seg-item', tab === id && 'seg-item-active')}>{l}</button>
            ))}
          </div>

          {tab === 'email' && (
            store.supabaseConfigured ? (
              <div className="space-y-3">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input" disabled={sent} />
                {sent && <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="邮箱里的 6 位验证码" className="input num text-center text-xl" autoFocus />}
                {msg && <div className="text-xs text-center text-muted">{msg}</div>}
                {!sent ? <Button onClick={send} disabled={busy || !email.includes('@')} className="w-full">发送验证码</Button>
                  : <Button onClick={verify} disabled={busy || code.length < 4} className="w-full">登录</Button>}
                {sent && <button onClick={() => { setSent(false); setCode('') }} className="w-full text-xs text-muted">换个邮箱</button>}
              </div>
            ) : <NotConfigured method="邮箱验证码登录" note="配置好 Supabase 后，邮箱登录即刻可用（无需额外费用）。" />
          )}

          {tab === 'phone' && <NotConfigured method="手机号验证码登录" note="需要接入短信服务商（阿里云/腾讯云短信）。在 Supabase 后台配置 SMS Provider 后即可开启，schema 已预留。" />}
          {tab === 'wechat' && <NotConfigured method="微信登录" note="需要在微信开放平台注册应用（企业主体，约 ¥300/年 + 审核）。拿到 AppID/Secret 后，部署 supabase/functions/wechat-auth 边缘函数即可扫码登录。流程与占位已备好。" />}

          <div className="mt-5 pt-4 border-t hairline">
            <div className="text-xs text-faint text-center leading-relaxed">
              {store.supabaseConfigured
                ? '登录后，你的记录会云端同步，并和真实玩家同场竞技。'
                : '当前为本地模式：数据存在本机，完整可玩。接入 Supabase 即变身真实多人。'}
            </div>
          </div>
        </>
      )}
    </Sheet>
  )
}

function NotConfigured({ method, note }: { method: string; note: string }) {
  return (
    <div className="rounded-2xl bg-subtle p-4 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-sm"><span className="w-6 h-6 rounded-full bg-warn/20 text-warn flex items-center justify-center text-xs">!</span>{method} · 待配置</div>
      <p className="text-xs text-muted leading-relaxed">{note}</p>
      <div className="flex items-center gap-1.5 text-xs text-gain pt-1"><IconCheck /> 代码 & 数据结构已就绪，配置即启用</div>
    </div>
  )
}
