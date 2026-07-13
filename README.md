# 搞钱局 · 财富段位赛

把真实的搞钱历程，玩成一场段位赛。记录真实收入与尝试 → 冲段位 → 上排行榜 → 组战队 → 约同城局。

> 重点是**真实**和**游戏化**：结果不是线性的，允许爆发；每一笔都可更新、可验证。

## 核心玩法

- **三重段位**：`当前段位`（可涨可跌，捕捉爆发）· `巅峰段位`（历史最高，永不失去）· `认证段位`（带凭证的收入，上真实榜）。
- **段位阶梯**：萌新 → 破晓(月入1w) → 起势(3w) → 破局(5w) → 操盘(10w) → 势成(30w) → 造风(100w)。
- **非线性 & 爆发**：单月收入是真实的锯齿曲线，某月翻倍 / 跨段会触发「🔥 爆发时刻」庆祝动画。
- **双轨成长**：段位（收入结果，会波动）+ 账号等级 XP（投入与坚持，只增不减）——搞钱有滞后，先奖励过程。
- **记录一切**：收入 / 尝试(副本) / 工作量 / 里程碑 + **自定义数据指标**（粉丝数、GMV、MRR、存款、时薪…任何能验证增长的数据）。
- **可验证**：凭证等级（截图/多重）→ 诚信分 → 同城互相背书。`真实榜` 只算带凭证的收入，`江湖榜` 算全部自报。
- **社交与线下**：多种排行榜（月收入 / 势能 / 工作量 / 坚持 / 新星）· 全国/同城/战队 · 战队 · **同城局**（线下报名）· 江湖动态。
- **财富路径分析**：财富曲线（带爆发标记）· 收入结构 & 多元度 · 时薪 · 数据驱动的「下一步建议」。

## 技术栈

React 19 · Vite 8 · TypeScript · Tailwind 3.4（CSS 变量令牌，深/浅色）· 手写 SVG 图表 · 手写动画（无动画库）· 可安装 PWA（离线）· Supabase（真实多人，可选）。

- **本地优先**：默认零后端即可完整试玩——你的真实数据存本机，社交/榜单由一个「活的」演示世界（几十个拟真玩家、战队、同城局）撑起。
- **一键联机**：填入 Supabase 配置后，`SupabaseAdapter` 自动接管，变成真实跨用户多人。见 [SETUP.md](./SETUP.md)。

```
src/
  types.ts            领域模型（扁平、可直存 jsonb）
  lib/
    tiers.ts          段位阶梯 + tierForIncome
    engine.ts         核心引擎：三重段位/势能/爆发/XP/诚信分/称号
    catalog.ts        收入来源·尝试类型·称号·城市
    seed.ts           「活的」演示世界（确定性生成）
    storage.ts        localStorage
    supabase.ts       客户端 + SUPABASE_READY 守卫
    cloud.ts          Supabase 镜像（联机时启用）
    format.ts / id.ts
  store.tsx           全局 Context：状态 + 动作 + 实时 stats
  components/         icons · ui · charts · EntrySheet · MetricSheet · ProfileSheet · AuthSheet · Ceremony
  views/              Onboarding · Home · Log · Leaderboards · Arena · Me
supabase/
  schema.sql          建表 + RLS + 硬化 RPC
  seed.sql            可选：给云端塞点演示数据
  functions/wechat-auth  微信登录边缘函数（占位，配置即用）
```

## 本地运行

```bash
npm install
npm run icons     # 从 public/icon.svg 生成 PWA 图标（需要 sharp）
npm run dev       # http://localhost:5200
npm run build     # 产物在 dist/
```

## 现状（诚实说明）

- ✅ 完整可玩：段位/记录/自定义数据/榜单/战队/同城局/路径分析/爆发庆祝，本地持久化 + 演示世界，PWA 可安装。
- 🔌 真实多人：代码路径 & `schema.sql` 已就绪，需你建 Supabase 项目并填配置（见 SETUP.md）。
- 🔑 登录：邮箱验证码在配好 Supabase 后即刻可用；手机需短信服务商；微信需开放平台 App + 部署边缘函数。
- 🧪 真机 & 联机端到端尚未验证（本机以浏览器预览验证过交互）。
