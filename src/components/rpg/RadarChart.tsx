import { useEffect, useRef } from 'react';

const VINTAGE_COLORS = {
  sage: '#B8C5A8',
  terracotta: '#C97064',
  mustard: '#D4A574',
  dustyBlue: '#A8B8C8',
  mauve: '#C8A2C8',
  burgundy: '#43302E',
};

interface RadarChartProps {
  type: 'positive' | 'negative';
  data: Array<{ label: string; value: number }>; // value: 0-100
}

export default function RadarChart({ type, data }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 60;
    const levels = 5; // 5个层级（0-20, 20-40, 40-60, 60-80, 80-100）

    // 绘制背景网格
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;

    for (let i = 1; i <= levels; i++) {
      const r = (radius / levels) * i;
      ctx.beginPath();
      
      for (let j = 0; j < data.length; j++) {
        const angle = (Math.PI * 2 * j) / data.length - Math.PI / 2;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.stroke();
    }

    // 绘制轴线
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1;

    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // 绘制数据区域
    const color = type === 'positive' ? VINTAGE_COLORS.sage : VINTAGE_COLORS.terracotta;
    
    ctx.fillStyle = `${color}40`; // 40% 透明度
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const value = data[i].value / 100; // 转换为0-1
      const r = radius * value;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 绘制数据点
    ctx.fillStyle = color;
    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const value = data[i].value / 100;
      const r = radius * value;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 绘制标签
    ctx.fillStyle = VINTAGE_COLORS.burgundy;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const labelRadius = radius + 30;
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      // 绘制标签背景
      const textWidth = ctx.measureText(data[i].label).width;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - textWidth / 2 - 4, y - 8, textWidth + 8, 16);
      
      // 绘制标签文字
      ctx.fillStyle = VINTAGE_COLORS.burgundy;
      ctx.fillText(data[i].label, x, y);
      
      // 绘制数值
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(`${data[i].value}`, x, y + 14);
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    }

  }, [data, type]);

  // 如果没有数据，显示占位符
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-400">
        <p>暂无数据</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <canvas ref={canvasRef} />
    </div>
  );
}

