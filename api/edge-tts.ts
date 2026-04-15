import type { VercelRequest, VercelResponse } from '@vercel/node';
import { tts } from 'edge-tts';

function toEdgeRate(rate?: number) {
  const safeRate = typeof rate === 'number' ? rate : 1;
  const percent = Math.round((safeRate - 1) * 100);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
}

function toEdgePitch(pitch?: number) {
  const safePitch = typeof pitch === 'number' ? pitch : 1;
  const hertz = Math.round((safePitch - 1) * 50);
  return `${hertz >= 0 ? '+' : ''}${hertz}Hz`;
}

function toEdgeVolume(volume?: number) {
  const safeVolume = typeof volume === 'number' ? volume : 1;
  const percent = Math.round((safeVolume - 1) * 100);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '只允许 POST 请求' });
  }

  try {
    const {
      text,
      voice = 'zh-CN-XiaoxiaoNeural',
      rate,
      pitch,
      volume,
    } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: '缺少 text 参数' });
    }

    const audioBuffer = await tts(text, {
      voice,
      rate: toEdgeRate(rate),
      pitch: toEdgePitch(pitch),
      volume: toEdgeVolume(volume),
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('Edge TTS 生成失败:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '语音生成失败',
    });
  }
}

















