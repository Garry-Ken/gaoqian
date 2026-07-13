# 接入真实多人（Supabase）

首版本地就能完整玩。想让别人真正一起玩、跨设备同步、真实排行榜——按下面 5 分钟接上 Supabase。

## 1. 建项目

1. 到 [supabase.com](https://supabase.com) 新建一个项目（免费额度够起步）。
2. 项目 → **Settings → API**，复制 `Project URL` 和 `anon public` key。

## 2. 建表 + 权限

打开 **SQL Editor**，把 [`supabase/schema.sql`](./supabase/schema.sql) 全部粘进去运行一次（幂等，可重复运行）。
它会建好 8 张表、行级安全策略（RLS）和硬化用的 RPC。

（可选）想让新部署不空荡荡，再运行一次 [`supabase/seed.sql`](./supabase/seed.sql) 塞几个演示玩家。

## 3. 填配置

新建 `.env`（或直接改 `src/lib/supabase.ts` 顶部两行）：

```bash
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的-anon-key
```

重启 `npm run dev`。顶栏出现「已联机」即接管成功——`SupabaseAdapter` 自动生效，你的数据云端同步，榜单变成真实玩家。

## 4. 登录方式

| 方式 | 需要什么 | 状态 |
|---|---|---|
| **邮箱验证码** | 无（Supabase Auth 默认开启） | 配好即用 ✅ |
| **手机验证码** | 在 Auth → Providers 里配置短信服务商（阿里云/腾讯云 SMS，按量计费） | 配好即用 |
| **微信登录** | 微信开放平台「网站应用」AppID/Secret（企业主体，约 ¥300/年 + 审核） | 见下 |

### 微信登录

1. 微信开放平台注册网站应用，拿到 `AppID` / `AppSecret`。
2. 设置密钥并部署边缘函数：
   ```bash
   supabase secrets set WECHAT_APP_ID=xxx WECHAT_APP_SECRET=xxx
   supabase functions deploy wechat-auth
   ```
3. 前端扫码拿到 `code` 后 POST 到该函数，即可换取会话（函数已写好换取逻辑，见 `supabase/functions/wechat-auth/index.ts`）。

未配置时，登录页会显示「待配置」并说明所需步骤——不会报错。

## 关于「可验证」

- 首版验证 = **社交层**：凭证等级（截图/多重）+ 诚信分 + 同城互相背书 + `真实榜/江湖榜` 分流。
- 更硬的验证（银行/平台账单直连、实名 KYC）需要各自的资质与接口，属于后续路线，不在首版。

## 部署到 Pages / Vercel

```bash
CI=1 npm run build     # base 会自动切到 /gaoqian/
```
把 `dist/` 传到 GitHub Pages / Vercel / Cloudflare Pages 即可。PWA、离线、加到主屏都已就绪。
