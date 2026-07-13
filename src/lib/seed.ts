import type { Profile, Team, MeetEvent, FeedItem, Endorsement, Comment } from '../types'
import { tierForIncome, tierById } from './tiers'
import { seededRng, pick, range } from './id'
import { wan } from './format'

// A curated cast so the world reads like real people, not procedural noise.
// archetype drives the income distribution + whether they have a 爆发 story.
type Arch = 'salary' | 'side' | 'product' | 'ecom' | 'content' | 'freelance' | 'invest' | 'cross'

interface Persona { h: string; n: string; a: string; c: string; k: Arch; story?: number }

const PERSONAS: Persona[] = [
  { h: 'chenduli', n: '独立开发老陈', a: '🧑‍💻', c: '杭州', k: 'product', story: 1 },
  { h: 'kuajing_zhen', n: '跨境阿珍', a: '👩‍💼', c: '深圳', k: 'cross', story: 1 },
  { h: 'content_may', n: '内容阿May', a: '🎬', c: '上海', k: 'content', story: 2 },
  { h: 'yirengongsi', n: '一人公司王哥', a: '🧔', c: '成都', k: 'product' },
  { h: 'fuye_lieren', n: '副业猎人', a: '🏹', c: '广州', k: 'side' },
  { h: 'xianjinliu', n: '现金流机器', a: '⚙️', c: '北京', k: 'invest', story: 1 },
  { h: 'ai_juejin', n: 'AI掘金小林', a: '🤖', c: '深圳', k: 'product', story: 2 },
  { h: 'dianshang_azhen', n: '电商阿true', a: '🛒', c: '义乌', k: 'ecom', story: 1 },
  { h: 'ziyou_zhang', n: '自由职业张', a: '🎨', c: '大理', k: 'freelance' },
  { h: 'banzhuan_zai', n: '深圳搬砖仔', a: '🧱', c: '深圳', k: 'salary' },
  { h: 'shouyi_ren', n: '手艺人老李', a: '🪚', c: '苏州', k: 'freelance' },
  { h: 'gupiao_ma', n: '投资小马哥', a: '📈', c: '上海', k: 'invest' },
  { h: 'zimeiti_qi', n: '自媒体阿七', a: '📱', c: '长沙', k: 'content', story: 2 },
  { h: 'kaiyuan_hou', n: '开源猴子', a: '🐒', c: '杭州', k: 'product' },
  { h: 'zhibo_hong', n: '直播阿红', a: '🎤', c: '广州', k: 'content' },
  { h: 'sheji_shi', n: '设计师阿树', a: '🖌️', c: '成都', k: 'freelance' },
  { h: 'pinpai_dai', n: '品牌操盘戴总', a: '👔', c: '上海', k: 'ecom', story: 1 },
  { h: 'xiaohongshu_yun', n: '小红书阿云', a: '📕', c: '杭州', k: 'content' },
  { h: 'jishu_lao', n: '技术顾问老周', a: '🔧', c: '北京', k: 'freelance' },
  { h: 'douyin_bao', n: '抖音阿豹', a: '🐆', c: '重庆', k: 'content', story: 2 },
  { h: 'saas_chuang', n: 'SaaS创业者', a: '☁️', c: '深圳', k: 'product' },
  { h: 'waimao_lin', n: '外贸阿琳', a: '🌏', c: '宁波', k: 'cross' },
  { h: 'zixun_gu', n: '咨询顾问顾姐', a: '💼', c: '北京', k: 'freelance' },
  { h: 'youxi_dai', n: '游戏搬砖代练', a: '🎮', c: '武汉', k: 'side' },
  { h: 'ketang_shi', n: '知识付费石老师', a: '📚', c: '南京', k: 'content' },
  { h: 'zhongchou_wen', n: '众筹阿文', a: '🎯', c: '深圳', k: 'product' },
  { h: 'baida_qing', n: '摆摊阿庆', a: '🍢', c: '长沙', k: 'side' },
  { h: 'lvzhi_fei', n: '绿植阿飞', a: '🪴', c: '昆明', k: 'ecom' },
  { h: 'ptc_amei', n: '陪跑阿美', a: '🏃‍♀️', c: '厦门', k: 'freelance' },
  { h: 'fanyi_tang', n: '翻译阿唐', a: '🈯', c: '西安', k: 'freelance' },
  { h: 'zhubao_lin', n: '珠宝阿琳', a: '💍', c: '广州', k: 'ecom' },
  { h: 'chongwu_dou', n: '宠物用品阿豆', a: '🐾', c: '成都', k: 'ecom' },
  { h: 'jianshen_kang', n: '健身教练阿康', a: '💪', c: '深圳', k: 'freelance' },
  { h: 'kafei_zhou', n: '咖啡主理人', a: '☕', c: '上海', k: 'side' },
  { h: 'lvxing_qi', n: '旅行博主起起', a: '✈️', c: '大理', k: 'content' },
  { h: 'jiaoyu_lan', n: '留学中介阿岚', a: '🎓', c: '北京', k: 'freelance' },
  { h: 'zhinengti_hao', n: 'Agent工厂阿豪', a: '🦾', c: '杭州', k: 'product', story: 2 },
  { h: 'ershou_jie', n: '二手电商阿杰', a: '📦', c: '武汉', k: 'ecom' },
  { h: 'peixun_shi', n: '企业培训师', a: '🎙️', c: '深圳', k: 'freelance' },
  { h: 'shipin_hao', n: '视频剪辑阿豪', a: '🎞️', c: '郑州', k: 'freelance' },
  { h: 'wenan_yao', n: '文案阿瑶', a: '✍️', c: '苏州', k: 'freelance' },
  { h: 'jubo_liang', n: '出海阿亮', a: '🚢', c: '深圳', k: 'cross', story: 1 },
  { h: 'guochao_qi', n: '国潮阿柒', a: '🧧', c: '成都', k: 'ecom' },
  { h: 'lingshou_min', n: '零售阿敏', a: '🏪', c: '天津', k: 'side' },
]

const TITLE_POOL = ['first_income', 'dawn', 'explorer', 'grinder', 'diversified', 'breakout', 'verified_pro', 'team_player', 'longterm']

function incomeFor(k: Arch, rng: () => number, story?: number): { month: number; momentum: number } {
  const base: Record<Arch, [number, number]> = {
    salary: [8000, 26000], side: [12000, 55000], product: [6000, 160000], ecom: [18000, 220000],
    content: [4000, 120000], freelance: [16000, 75000], invest: [10000, 90000], cross: [28000, 260000],
  }
  const [lo, hi] = base[k]
  let month = Math.round((lo + rng() * (hi - lo)) / 500) * 500
  let momentum = Math.round((rng() * 90 - 25))
  if (story === 1) { month = Math.round(month * (1.6 + rng())); momentum = Math.round(60 + rng() * 120) }
  if (story === 2) { month = Math.round(month * (1.2 + rng() * 0.6)); momentum = Math.round(220 + rng() * 500) } // viral 势能
  return { month, momentum }
}

export interface World {
  profiles: Profile[]
  teams: Team[]
  events: MeetEvent[]
  feed: FeedItem[]
  comments: Comment[]
  endorsements: Endorsement[]
}

const COMMENT_POOL = [
  '牛啊,带带我', '这个可以细说吗', '恭喜恭喜🎉', '求个思路', '真实,我也在做这个',
  '数据能看看吗', '同城的+1', '厉害了,冲', '这波稳', '蹲一个复盘', '羡慕,继续加油',
  '一起搞', '求拉群', '这月我也爆发了哈哈', '学到了', '接下来怎么规划的', '实锤,靠谱',
]

export function buildWorld(now: Date): World {
  const rng = seededRng(20260713)
  const joinBase = now.getTime()

  const profiles: Profile[] = PERSONAS.map((p, i) => {
    const { month, momentum } = incomeFor(p.k, rng, p.story)
    const verified = Math.round(month * (0.45 + rng() * 0.5))
    const cur = tierForIncome(month)
    const peakBump = p.story ? 1 : rng() > 0.7 ? 1 : 0
    const peak = tierForIncome(month * (p.story === 1 ? 1.8 : 1) + peakBump * cur.threshold)
    const integrity = Math.round(55 + rng() * 43)
    const titleN = 1 + Math.floor(rng() * 4)
    return {
      id: `demo_${p.h}`,
      handle: p.h,
      name: p.n,
      avatar: p.a,
      city: p.c,
      bio: '',
      joinedAt: new Date(joinBase - (60 + i * 7 + rng() * 300) * 86400000).toISOString(),
      visibility: 'public',
      isDemo: true,
      snapMonthIncome: month,
      snapVerifiedMonthIncome: verified,
      snapCurrentTier: cur.id,
      snapPeakTier: peak.id,
      snapVerifiedTier: tierForIncome(verified).id,
      snapMomentum: momentum,
      snapEffortWeek: Math.round(6 + rng() * 60),
      snapStreakMonths: 1 + Math.floor(rng() * 20),
      snapIntegrity: integrity,
      snapLevel: 2 + Math.floor(rng() * 28),
      snapTitles: [...TITLE_POOL].sort(() => rng() - 0.5).slice(0, titleN),
    }
  })

  // teams
  const teamDefs: [string, string, string, string][] = [
    ['深圳搞钱特工队', '🕶️', '深圳', '在深圳，没有不搞钱的夜晚'],
    ['杭州独立开发者联盟', '🦄', '杭州', '一个人也是一支军队'],
    ['上海内容创作局', '🎬', '上海', '流量即现金流'],
    ['成都躺赚研究所', '🐼', '成都', '边喝茶边搞钱'],
    ['跨境出海战舰', '🚢', '广州', '把货卖到全世界'],
    ['副业特种兵', '🥷', '北京', '主业养身，副业养梦'],
    ['AI掘金大队', '🤖', '深圳', '用 AI 撬动现金流'],
    ['电商夜袭队', '🛒', '义乌', '爆单的都是自己人'],
  ]
  const teams: Team[] = teamDefs.map(([name, emoji, city, motto], i) => {
    const members = profiles.filter((p) => p.city === city).slice(0, 3 + Math.floor(rng() * 4))
    const ids = members.map((m) => m.id)
    return {
      id: `team_${i}`, name, emoji, city, motto, ownerId: ids[0] ?? profiles[i].id,
      memberIds: ids.length ? ids : [profiles[i].id], createdAt: new Date(joinBase - (30 + i * 12) * 86400000).toISOString(), isDemo: true,
    }
  })
  profiles.forEach((p) => {
    const t = teams.find((tm) => tm.memberIds.includes(p.id))
    if (t) p.teamId = t.id
  })

  // events (同城局) — future-dated relative to now
  const evTags = ['饭局', '项目对接', '复盘会', '资源交换', '认知碰撞', '合伙搭子']
  const evTitles = [
    '搞钱局 · 周五夜谈', '独立开发者线下复盘', '跨境电商选品交流饭局', '内容创作者选题碰撞局',
    '副业变现经验交换', '一人公司的100种活法', 'AI 工具变现闭门会', '本月冲榜庆功局',
    '投资与现金流茶话会', '新手上路 · 破晓局', '出海项目找搭子', '设计师接单资源局',
  ]
  const events: MeetEvent[] = evTitles.map((title, i) => {
    const host = profiles[(i * 3) % profiles.length]
    const cap = 6 + Math.floor(rng() * 14)
    const attendees = profiles.filter(() => rng() > 0.72).slice(0, Math.min(cap - 1, 2 + Math.floor(rng() * 8)))
    return {
      id: `event_${i}`, title, city: host.city ?? '深圳',
      location: `${host.city ?? '深圳'}·${pick(rng, ['南山WeWork', '天河CBD咖啡馆', '西湖边共享空间', '市中心路演厅', '创业孵化器'])}`,
      startAt: new Date(joinBase + (2 + i * 3 + rng() * 2) * 86400000).toISOString(),
      hostId: host.id, teamId: teams.find((t) => t.memberIds.includes(host.id))?.id,
      capacity: cap, tags: [...evTags].sort(() => rng() - 0.5).slice(0, 2 + Math.floor(rng() * 2)),
      description: '真实搞钱人的线下局：聊聊这个月各自的进展、踩过的坑、下一步的打算。带上你最近的一个尝试。',
      attendeeIds: attendees.map((a) => a.id), createdAt: new Date(joinBase - (i + 1) * 86400000).toISOString(), isDemo: true,
    }
  })

  // feed
  const feed: FeedItem[] = []
  range(28).forEach((i) => {
    const actor = profiles[(i * 5 + 3) % profiles.length]
    const roll = rng()
    let kind: FeedItem['kind'] = 'income'
    let text = ''
    let amount: number | undefined
    let tierId: string | undefined
    if (roll < 0.3) {
      kind = 'income'; amount = Math.round((actor.snapMonthIncome ?? 20000) * (0.2 + rng() * 0.6) / 500) * 500
      text = `记录了一笔${pick(rng, ['副业', '项目', '电商', '内容', '咨询'])}收入 ${wan(amount)}`
    } else if (roll < 0.5) {
      kind = 'breakthrough'; amount = actor.snapMonthIncome
      text = `本月爆发！单月冲到 ${wan(actor.snapMonthIncome ?? 0)}，${Math.round(1.5 + rng() * 3)}倍于上月`
    } else if (roll < 0.7) {
      kind = 'rankup'; tierId = actor.snapCurrentTier
      text = `升段了！晋级「${tierById(actor.snapCurrentTier ?? 't0').name}」`
    } else if (roll < 0.85) {
      kind = 'venture'; text = `开了个新副本：${pick(rng, ['做一个AI小工具', '开始做小红书', '接了个跨境单', '上架了新产品', '试水直播带货'])}`
    } else {
      kind = 'milestone'; text = pick(rng, ['辞职 all in 了', '第一次月入过万', '产品付费用户破百', '被动收入覆盖房租了'])
    }
    feed.push({
      id: `feed_${i}`, actorId: actor.id, kind, text, amount, tierId,
      at: new Date(joinBase - (i * 6 + rng() * 5) * 3600000).toISOString(),
      cheers: profiles.filter(() => rng() > 0.8).map((p) => p.id).slice(0, Math.floor(rng() * 12)), isDemo: true,
    })
  })

  // a few endorsements between demo players
  const endorsements: Endorsement[] = []
  range(24).forEach((i) => {
    const from = profiles[(i * 7) % profiles.length]
    const to = profiles[(i * 5 + 11) % profiles.length]
    if (from.id === to.id) return
    endorsements.push({
      id: `endo_${i}`, fromId: from.id, toId: to.id,
      note: pick(rng, ['一起吃过饭，收入是真的', '合作过，靠谱', '线下见过，真实', '同一个局的，实锤']),
      at: new Date(joinBase - i * 2 * 86400000).toISOString(),
    })
  })

  // comments on some feed items
  const comments: Comment[] = []
  feed.forEach((f, fi) => {
    const nc = Math.floor(rng() * 3.5)
    for (let j = 0; j < nc; j++) {
      const author = profiles[(fi * 3 + j * 7 + 5) % profiles.length]
      comments.push({
        id: `cm_${fi}_${j}`, feedId: f.id, authorId: author.id,
        text: pick(rng, COMMENT_POOL),
        at: new Date(+new Date(f.at) + (j + 1) * (600000 + rng() * 3600000)).toISOString(), isDemo: true,
      })
    }
  })

  return { profiles, teams, events, feed, comments, endorsements }
}
