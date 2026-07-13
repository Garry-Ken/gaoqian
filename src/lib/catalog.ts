import type { IncomeSourceId, AttemptCategoryId } from '../types'

export interface Meta<T extends string> {
  id: T
  label: string
  emoji: string
  color: string
}

export const INCOME_SOURCES: Meta<IncomeSourceId>[] = [
  { id: 'salary', label: '工资', emoji: '💼', color: '#0a84ff' },
  { id: 'side', label: '副业', emoji: '🌙', color: '#bf5af2' },
  { id: 'freelance', label: '自由职业', emoji: '🎨', color: '#34d9c9' },
  { id: 'project', label: '项目/合同', emoji: '📦', color: '#5e5ce6' },
  { id: 'ecom', label: '电商', emoji: '🛒', color: '#ff9f0a' },
  { id: 'content', label: '内容/自媒体', emoji: '🎬', color: '#ff375f' },
  { id: 'invest', label: '投资收益', emoji: '📈', color: '#30d158' },
  { id: 'passive', label: '被动收入', emoji: '🛋️', color: '#63e6be' },
  { id: 'windfall', label: '爆发/意外', emoji: '💥', color: '#f5c542' },
  { id: 'other', label: '其他', emoji: '✨', color: '#8e8e93' },
]

export const ATTEMPT_CATEGORIES: Meta<AttemptCategoryId>[] = [
  { id: 'side', label: '搞副业', emoji: '🌙', color: '#bf5af2' },
  { id: 'product', label: '做产品', emoji: '🚀', color: '#0a84ff' },
  { id: 'gig', label: '接活/接单', emoji: '🛠️', color: '#34d9c9' },
  { id: 'content', label: '做内容', emoji: '🎬', color: '#ff375f' },
  { id: 'learn', label: '学技能', emoji: '📚', color: '#5e5ce6' },
  { id: 'invest', label: '投资', emoji: '📊', color: '#30d158' },
  { id: 'pivot', label: '换赛道', emoji: '🔀', color: '#ff9f0a' },
  { id: 'partner', label: '找合伙', emoji: '🤝', color: '#63e6be' },
  { id: 'other', label: '其他', emoji: '✨', color: '#8e8e93' },
]

export function sourceMeta(id?: IncomeSourceId): Meta<IncomeSourceId> {
  return INCOME_SOURCES.find((s) => s.id === id) ?? INCOME_SOURCES[INCOME_SOURCES.length - 1]
}
export function attemptMeta(id?: AttemptCategoryId): Meta<AttemptCategoryId> {
  return ATTEMPT_CATEGORIES.find((s) => s.id === id) ?? ATTEMPT_CATEGORIES[ATTEMPT_CATEGORIES.length - 1]
}

export interface TitleDef {
  id: string
  name: string
  emoji: string
  desc: string
}

export const TITLES: TitleDef[] = [
  { id: 'first_income', name: '首杀', emoji: '🎯', desc: '记录第一笔真实收入' },
  { id: 'dawn', name: '破晓', emoji: '🌅', desc: '首次单月收入破 1 万' },
  { id: 'explorer', name: '试错者', emoji: '🧪', desc: '记录满 10 次尝试' },
  { id: 'grinder', name: '苦行僧', emoji: '🧘', desc: '连续记录满 21 天' },
  { id: 'diversified', name: '六边形战士', emoji: '🛡️', desc: '收入来源达到 4 种以上' },
  { id: 'breakout', name: '爆发户', emoji: '💥', desc: '单月收入达到基线的 3 倍' },
  { id: 'comeback', name: '逆袭', emoji: '🔥', desc: '单月一口气跨越 2 个段位' },
  { id: 'verified_pro', name: '实锤王', emoji: '✅', desc: '80% 以上收入带凭证' },
  { id: 'team_player', name: '局中人', emoji: '🎲', desc: '参加一次同城局' },
  { id: 'mentor', name: '带头大哥', emoji: '🫱', desc: '给 10 位玩家背书' },
  { id: 'longterm', name: '长期主义', emoji: '🌲', desc: '入局满一年仍在记录' },
  { id: 'windmaker', name: '造风者', emoji: '👑', desc: '冲上月入 100 万段位' },
]

export function titleMeta(id: string): TitleDef | undefined {
  return TITLES.find((t) => t.id === id)
}

export const CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州', '西安',
  '长沙', '重庆', '郑州', '天津', '青岛', '厦门', '东莞', '佛山', '宁波', '合肥',
  '福州', '济南', '昆明', '大连', '沈阳', '无锡', '珠海', '海口', '南昌', '贵阳',
]

export const EVENT_TAGS = ['饭局', '项目对接', '复盘会', '资源交换', '搞钱局', '认知碰撞', '合伙搭子']
