-- ============================================================
-- 搞钱局 · 可选演示数据（云端）
-- 让新部署的排行榜/动态不至于空荡荡。随时可删：
--   delete from public.profiles where (data->>'isDemo')::boolean is true;
--   delete from public.feed where (data->>'isDemo')::boolean is true;
-- 注意：这些是无 auth.users 关联的展示用行，profiles.id 用非 uuid 的
-- 'seed_*' 字符串会与 uuid 主键冲突，因此这里改插入到一张独立展示表。
-- 若只想本地演示世界，忽略本文件即可（客户端已内置几十个拟真玩家）。
-- ============================================================

-- 展示用只读表（与真实 profiles 分开，避免污染 auth 关联）
create table if not exists public.demo_profiles (
  id text primary key,
  data jsonb not null
);
alter table public.demo_profiles enable row level security;
drop policy if exists demo_read on public.demo_profiles;
create policy demo_read on public.demo_profiles for select using (true);

insert into public.demo_profiles (id, data) values
('seed_1', '{"id":"seed_1","name":"独立开发老陈","avatar":"🧑‍💻","city":"杭州","handle":"chenduli","joinedAt":"2025-06-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":128000,"snapVerifiedMonthIncome":90000,"snapCurrentTier":"t4","snapPeakTier":"t6","snapVerifiedTier":"t4","snapMomentum":140,"snapEffortWeek":42,"snapStreakMonths":11,"snapIntegrity":88,"snapLevel":22,"snapTitles":["dawn","breakout","verified_pro"]}'),
('seed_2', '{"id":"seed_2","name":"跨境阿珍","avatar":"👩‍💼","city":"深圳","handle":"kuajing","joinedAt":"2025-03-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":320000,"snapVerifiedMonthIncome":210000,"snapCurrentTier":"t5","snapPeakTier":"t5","snapVerifiedTier":"t5","snapMomentum":52,"snapEffortWeek":55,"snapStreakMonths":16,"snapIntegrity":91,"snapLevel":28,"snapTitles":["dawn","diversified","verified_pro"]}'),
('seed_3', '{"id":"seed_3","name":"内容阿May","avatar":"🎬","city":"上海","handle":"contentmay","joinedAt":"2026-04-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":86000,"snapVerifiedMonthIncome":40000,"snapCurrentTier":"t3","snapPeakTier":"t4","snapVerifiedTier":"t2","snapMomentum":620,"snapEffortWeek":38,"snapStreakMonths":3,"snapIntegrity":72,"snapLevel":9,"snapTitles":["dawn","breakout"]}'),
('seed_4', '{"id":"seed_4","name":"一人公司王哥","avatar":"🧔","city":"成都","handle":"yiren","joinedAt":"2025-01-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":55000,"snapVerifiedMonthIncome":48000,"snapCurrentTier":"t3","snapPeakTier":"t4","snapVerifiedTier":"t3","snapMomentum":18,"snapEffortWeek":30,"snapStreakMonths":20,"snapIntegrity":94,"snapLevel":31,"snapTitles":["dawn","longterm","verified_pro","diversified"]}'),
('seed_5', '{"id":"seed_5","name":"AI掘金小林","avatar":"🤖","city":"深圳","handle":"aijuejin","joinedAt":"2026-05-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":42000,"snapVerifiedMonthIncome":15000,"snapCurrentTier":"t2","snapPeakTier":"t3","snapVerifiedTier":"t1","snapMomentum":380,"snapEffortWeek":48,"snapStreakMonths":2,"snapIntegrity":68,"snapLevel":6,"snapTitles":["dawn","explorer"]}'),
('seed_6', '{"id":"seed_6","name":"副业猎人","avatar":"🏹","city":"广州","handle":"fuye","joinedAt":"2025-09-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":31000,"snapVerifiedMonthIncome":22000,"snapCurrentTier":"t2","snapPeakTier":"t2","snapVerifiedTier":"t2","snapMomentum":40,"snapEffortWeek":26,"snapStreakMonths":9,"snapIntegrity":80,"snapLevel":14,"snapTitles":["dawn","grinder","diversified"]}'),
('seed_7', '{"id":"seed_7","name":"电商阿真","avatar":"🛒","city":"义乌","handle":"ds","joinedAt":"2025-02-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":180000,"snapVerifiedMonthIncome":120000,"snapCurrentTier":"t4","snapPeakTier":"t5","snapVerifiedTier":"t4","snapMomentum":95,"snapEffortWeek":60,"snapStreakMonths":18,"snapIntegrity":86,"snapLevel":26,"snapTitles":["dawn","breakout","verified_pro"]}'),
('seed_8', '{"id":"seed_8","name":"设计师阿树","avatar":"🖌️","city":"成都","handle":"sheji","joinedAt":"2025-11-01T00:00:00Z","visibility":"public","isDemo":true,"snapMonthIncome":24000,"snapVerifiedMonthIncome":20000,"snapCurrentTier":"t1","snapPeakTier":"t2","snapVerifiedTier":"t1","snapMomentum":12,"snapEffortWeek":22,"snapStreakMonths":7,"snapIntegrity":83,"snapLevel":11,"snapTitles":["dawn","grinder"]}')
on conflict (id) do update set data = excluded.data;
