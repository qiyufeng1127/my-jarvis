-- =============================================
-- 删除指定邮箱的所有用户账号
-- =============================================
-- 用于清理重复注册的账号，让用户可以重新注册

-- 删除邮箱为 2432073546@qq.com 的所有用户
DELETE FROM auth.users 
WHERE email = '2432073546@qq.com';

-- 验证删除结果
SELECT 
  COUNT(*) as remaining_users,
  '如果显示 0，说明删除成功' as message
FROM auth.users 
WHERE email = '2432073546@qq.com';

-- 完成提示
SELECT '✅ 用户账号已删除！现在可以重新注册了' as result;

