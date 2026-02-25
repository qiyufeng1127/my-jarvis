# 图像验证CORS问题修复

## 问题
浏览器直接调用百度API存在跨域限制，导致验证失败。

## 解决方案
使用Serverless API代理，避免浏览器跨域问题。

## 修改的文件

### 1. `api/baidu-image-recognition.ts` (新建)
- Vercel Serverless Function
- 服务端代理百度API调用
- 避免CORS跨域问题

### 2. `vercel.json` (更新)
- 添加API路由配置
- 添加CORS头设置

### 3. `src/services/baiduImageRecognition.ts` (更新)
- 添加环境检测 `isProduction()`
- 生产环境：使用 `/api/baidu-image-recognition`
- 开发环境：使用 Vite 代理 `/baidu-api/`

## 工作原理

### 开发环境（本地）
```
浏览器 → Vite代理 → 百度API
```

### 生产环境（Vercel）
```
浏览器 → Serverless API → 百度API
```

## 部署步骤

1. **提交代码**
```bash
git add .
git commit -m "fix: 修复图像验证CORS问题"
git push
```

2. **Vercel自动部署**
- Serverless Function会自动部署到 `/api/baidu-image-recognition`

3. **测试**
- 访问部署的应用
- 测试图像验证功能
- 应该不再出现CORS错误

## 注意事项

1. **API密钥安全**
   - API密钥通过POST请求体传递
   - 不会暴露在URL中
   - Serverless Function在服务端执行

2. **性能优化**
   - Access Token缓存（避免频繁请求）
   - 场景识别和物体检测在生产环境暂时禁用（可选功能）

3. **错误处理**
   - 完整的错误日志
   - 明确的错误提示

## 测试清单

- [ ] 本地开发环境验证正常
- [ ] Vercel部署后验证正常
- [ ] 不再出现CORS错误
- [ ] 识别结果正确返回

## 如果还有问题

检查：
1. Serverless Function是否部署成功
2. API密钥是否正确配置
3. 网络连接是否正常
4. 查看Vercel Function日志

