import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_HEADERS = 'Content-Type, Authorization';
const ALLOWED_METHODS = 'POST, OPTIONS';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '只允许 POST 请求' });
  }

  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({ success: false, error: '缺少 Authorization 头' });
    }

    const upstreamResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(req.body || {}),
    });

    const contentType = upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8';
    res.status(upstreamResponse.status);
    res.setHeader('Content-Type', contentType);

    if (!upstreamResponse.body) {
      const text = await upstreamResponse.text();
      return res.send(text);
    }

    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      res.write(decoder.decode(value, { stream: true }));
    }

    const finalChunk = decoder.decode();
    if (finalChunk) {
      res.write(finalChunk);
    }

    return res.end();
  } catch (error) {
    console.error('❌ [DeepSeek Proxy] 请求失败:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'DeepSeek 代理请求失败',
    });
  }
}

