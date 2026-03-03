import { useEffect, useRef } from 'react';
import { useRPGStore } from '@/stores/rpgStore';
import { X, TreeDeciduous } from 'lucide-react';

const VINTAGE_COLORS = {
  buttermilk: '#FFF1B5',
  pastelBlue: '#C1DBE8',
  burgundy: '#43302E',
  tangerine: '#EAA239',
  cream: '#FFF4A1',
  leaves: '#8F9E25',
  wisteria: '#C3A5C1',
  mulberry: '#97332C',
  khaki: '#D4C5A0',
  softPink: '#F5D5CB',
  paleGreen: '#C8D5B9',
  dustyRed: '#C97064',
};

interface GrowthTreeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GrowthTree({ isOpen, onClose }: GrowthTreeProps) {
  const { character, growthTree } = useRPGStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 绘制树干
    drawTrunk(ctx, rect.width / 2, rect.height - 50, rect.height - 200);

    // 绘制叶子和花朵
    const leafCount = Math.min(character.level, 50); // 最多50片叶子
    const flowerCount = Math.floor(character.level / 10); // 每10级一朵花
    const improvementBranches = growthTree.filter(n => n.type === 'improvement-branch').length;

    // 绘制主枝叶子
    for (let i = 0; i < leafCount; i++) {
      const angle = (Math.PI / 3) * (Math.random() - 0.5);
      const distance = 50 + Math.random() * 100;
      const x = rect.width / 2 + Math.cos(angle) * distance;
      const y = rect.height - 200 - i * 5;
      
      drawLeaf(ctx, x, y, VINTAGE_COLORS.leaves);
    }

    // 绘制花朵
    for (let i = 0; i < flowerCount; i++) {
      const angle = (Math.PI / 2) * (Math.random() - 0.5);
      const distance = 60 + Math.random() * 80;
      const x = rect.width / 2 + Math.cos(angle) * distance;
      const y = rect.height - 250 - i * 40;
      
      drawFlower(ctx, x, y, VINTAGE_COLORS.softPink);
    }

    // 绘制改进分支
    for (let i = 0; i < improvementBranches; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const branchX = rect.width / 2 + side * (80 + i * 30);
      const branchY = rect.height - 150 - i * 50;
      
      drawBranch(ctx, rect.width / 2, rect.height - 150 - i * 50, branchX, branchY);
      drawLeaf(ctx, branchX, branchY, VINTAGE_COLORS.tangerine);
    }

  }, [isOpen, character.level, growthTree]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: VINTAGE_COLORS.cream }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div 
          className="p-6 relative"
          style={{ backgroundColor: VINTAGE_COLORS.leaves }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <TreeDeciduous className="w-8 h-8 text-white" />
            <h2 className="text-2xl font-bold text-white">成长之树</h2>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div className="text-2xl font-bold text-white">{character.level}</div>
              <div className="text-xs text-white opacity-80">等级</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div className="text-2xl font-bold text-white">{Math.min(character.level, 50)}</div>
              <div className="text-xs text-white opacity-80">叶片</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <div className="text-2xl font-bold text-white">{Math.floor(character.level / 10)}</div>
              <div className="text-xs text-white opacity-80">花朵</div>
            </div>
          </div>
        </div>

        {/* 成长树画布 */}
        <div className="flex-1 relative overflow-hidden" style={{ backgroundColor: VINTAGE_COLORS.buttermilk }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* 图例 */}
        <div 
          className="p-4"
          style={{ backgroundColor: VINTAGE_COLORS.buttermilk }}
        >
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: VINTAGE_COLORS.leaves }} />
              <span style={{ color: VINTAGE_COLORS.burgundy }}>叶片：每升1级</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: VINTAGE_COLORS.softPink }} />
              <span style={{ color: VINTAGE_COLORS.burgundy }}>花朵：每完成1个大目标</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: VINTAGE_COLORS.tangerine }} />
              <span style={{ color: VINTAGE_COLORS.burgundy }}>改进分支：每改进1个弱势</span>
            </div>
          </div>
        </div>

        {/* 底部提示 */}
        <div 
          className="p-4 text-center text-sm"
          style={{ 
            backgroundColor: VINTAGE_COLORS.paleGreen,
            color: VINTAGE_COLORS.burgundy
          }}
        >
          🌱 你的成长之树正在茁壮成长！继续努力，让它开出更多花朵吧～
        </div>
      </div>
    </div>
  );
}

// 绘制树干
function drawTrunk(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.fillStyle = VINTAGE_COLORS.burgundy;
  ctx.fillRect(x - 15, y, 30, height);
}

// 绘制叶子
function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 8, 12, Math.random() * Math.PI, 0, Math.PI * 2);
  ctx.fill();
}

// 绘制花朵
function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  // 花瓣
  ctx.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 / 5) * i;
    const petalX = x + Math.cos(angle) * 8;
    const petalY = y + Math.sin(angle) * 8;
    ctx.beginPath();
    ctx.arc(petalX, petalY, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 花心
  ctx.fillStyle = VINTAGE_COLORS.tangerine;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
}

// 绘制分支
function drawBranch(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.strokeStyle = VINTAGE_COLORS.burgundy;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

