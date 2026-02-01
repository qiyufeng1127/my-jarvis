-- =============================================
-- 修复 sync_codes 表的唯一约束问题
-- =============================================

-- 为 user_id 列添加唯一约束
-- 注意：如果已有重复的 user_id，需要先清理
ALTER TABLE public.sync_codes 
ADD CONSTRAINT sync_codes_user_id_unique UNIQUE (user_id);

-- 完成
SELECT '✅ 唯一约束添加成功！' as message;

