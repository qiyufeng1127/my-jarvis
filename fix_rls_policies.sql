-- ============================================
-- 检查并修复同步码的 RLS 策略
-- ============================================

-- 查看当前的 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('sync_groups', 'sync_devices', 'sync_data')
ORDER BY tablename, policyname;

-- 删除所有旧策略
DROP POLICY IF EXISTS "Allow anon access to sync_groups" ON sync_groups;
DROP POLICY IF EXISTS "Allow auth access to sync_groups" ON sync_groups;
DROP POLICY IF EXISTS "Allow anon access to sync_devices" ON sync_devices;
DROP POLICY IF EXISTS "Allow auth access to sync_devices" ON sync_devices;
DROP POLICY IF EXISTS "Allow anon access to sync_data" ON sync_data;
DROP POLICY IF EXISTS "Allow auth access to sync_data" ON sync_data;

-- 创建新的宽松策略（允许所有操作）
CREATE POLICY "Allow all for sync_groups" ON sync_groups
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for sync_devices" ON sync_devices
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for sync_data" ON sync_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 验证策略已创建
SELECT 
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('sync_groups', 'sync_devices', 'sync_data')
ORDER BY tablename;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ RLS 策略已更新！';
  RAISE NOTICE '';
  RAISE NOTICE '所有表现在允许匿名访问（不需要登录）';
  RAISE NOTICE '这样手机端和电脑端都可以正常使用同步码';
  RAISE NOTICE '';
  RAISE NOTICE '请重新测试加入同步码功能';
END $$;

