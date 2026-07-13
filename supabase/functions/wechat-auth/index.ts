// ============================================================
// 搞钱局 · WeChat 登录边缘函数 (Supabase Edge Function, Deno)
//
// 微信网页扫码登录（开放平台）的服务端换取流程。前端拿到 code 后
// POST 到这里，服务端用 AppID/Secret 换 openid，再用 service_role
// 创建/登录对应 Supabase 用户并签发会话。
//
// 部署前需要：
//   1. 在微信开放平台注册「网站应用」，拿到 AppID / AppSecret（企业主体）
//   2. supabase secrets set WECHAT_APP_ID=... WECHAT_APP_SECRET=...
//   3. supabase functions deploy wechat-auth
//
// 未配置 secrets 时返回 501，前端据此显示「待配置」（AuthSheet 已处理）。
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_ID = Deno.env.get('WECHAT_APP_ID')
const APP_SECRET = Deno.env.get('WECHAT_APP_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!APP_ID || !APP_SECRET) {
    return json({ error: 'wechat_not_configured' }, 501)
  }
  try {
    const { code } = await req.json()
    if (!code) return json({ error: 'missing_code' }, 400)

    // 1) code -> access_token + openid
    const tokenRes = await fetch(
      `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APP_ID}&secret=${APP_SECRET}&code=${code}&grant_type=authorization_code`,
    ).then((r) => r.json())
    const openid: string | undefined = tokenRes.openid
    if (!openid) return json({ error: 'wechat_exchange_failed', detail: tokenRes }, 400)

    // 2) (optional) fetch nickname/avatar
    let nickname = '微信用户'
    let avatar = ''
    if (tokenRes.access_token) {
      const info = await fetch(
        `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenRes.access_token}&openid=${openid}`,
      ).then((r) => r.json()).catch(() => ({}))
      nickname = info.nickname ?? nickname
      avatar = info.headimgurl ?? ''
    }

    // 3) map openid -> a stable Supabase user (email-less, deterministic)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
    const email = `wx_${openid}@wechat.gaoqian.local`
    const password = `${openid}.${APP_ID}` // deterministic; user never types it

    // create if absent, then sign in to mint a session
    await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { provider: 'wechat', openid, nickname, avatar },
    }).catch(() => {/* already exists */})

    const anon = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data, error } = await anon.auth.signInWithPassword({ email, password })
    if (error) return json({ error: error.message }, 400)

    return json({ session: data.session, profile: { nickname, avatar, openid } })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })
}
