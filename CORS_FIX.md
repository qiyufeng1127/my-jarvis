# 百度API CORS问题修复

## 问题
浏览器直接调用百度API存在跨域限制，导致功能失败。

## 影响的功能
1. **图像验证** - 百度图像识别API
2. **免手模式** - 百度语音识别API

## 解决方案
使用Serverless API代理，避免浏览器跨域问题。

## 修改的文件

### 1. Serverless Functions (新建)
- `api/baidu-image-recognition.ts` - 图像识别API代理
- `api/baidu-voice-recognition.ts` - 语音识别API代理

### 2. `vercel.json` (更新)
- 添加API路由配置
- 添加CORS头设置

### 3. 客户端服务 (更新)
- `src/services/baiduImageRecognition.ts` - 图像识别服务
- `src/services/baiduVoiceRecognition.ts` - 语音识别服务
- 添加环境检测 `isProduction()`
- 生产环境：使用 Serverless API
- 开发环境：直接调用百度API

## 工作原理

### 开发环境（本地）
```
浏览器 → 百度API（直接调用）
```

### 生产环境（Vercel）
```
浏览器 → Serverless API → 百度API
```

## API端点

### 图像识别
- **端点**: `/api/baidu-image-recognition`
- **方法**: POST
- **参数**: 
  ```json
  {
    "imageBase64": "data:image/jpeg;base64,...",
    "apiKey": "your-api-key",
    "secretKey": "your-secret-key"
  }
  ```

### 语音识别
- **端点**: `/api/baidu-voice-recognition`
- **方法**: POST
- **参数**:
  ```json
  {
    "audioBase64": "base64-audio-data",
    "format": "wav",
    "rate": 16000,
    "apiKey": "your-api-key",
    "secretKey": "your-secret-key"
  }
  ```

## 部署步骤

1. **提交代码**
```bash
git add .
git commit -m "fix: 修复百度API CORS问题（图像+语音）"
git push
```

2. **Vercel自动部署**
- Serverless Functions会自动部署
- `/api/baidu-image-recognition`
- `/api/baidu-voice-recognition`

3. **测试**
- 测试图像验证功能
- 测试免手模式语音识别
- 应该不再出现CORS错误

## 注意事项

1. **API密钥安全**
   - API密钥通过POST请求体传递
   - 不会暴露在URL中
   - Serverless Function在服务端执行

2. **性能优化**
   - Access Token缓存（避免频繁请求）
   - 两个API共享Token缓存机制

3. **错误处理**
   - 完整的错误日志
   - 明确的错误提示

## 测试清单

### 图像验证
- [ ] 本地开发环境验证正常
- [ ] Vercel部署后验证正常
- [ ] 不再出现CORS错误
- [ ] 识别结果正确返回

### 语音识别
- [ ] 本地开发环境识别正常
- [ ] Vercel部署后识别正常
- [ ] 不再出现CORS错误
- [ ] 语音转文字正确

## 如果还有问题

检查：
1. Serverless Functions是否部署成功
2. API密钥是否正确配置
3. 网络连接是否正常
4. 查看Vercel Function日志

## 环境检测逻辑

```typescript
private isProduction(): boolean {
  return window.location.hostname.includes('vercel.app') || 
         window.location.hostname.includes('your-domain.com') ||
         import.meta.env.PROD;
}
```

- `vercel.app` - Vercel部署域名
- `your-domain.com` - 自定义域名（如有）
- `import.meta.env.PROD` - Vite生产环境标志

