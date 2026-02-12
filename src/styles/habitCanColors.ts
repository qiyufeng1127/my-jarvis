/**
 * 习惯罐头 iOS 风格配色方案
 * 灵感来源：复古暖棕 + 现代毛玻璃
 */

export const HABIT_CAN_COLORS = {
  // 主色系
  espresso: '#542916',      // 深棕 - 导航栏、按钮、标题
  eauTrouble: '#b79858',    // 金棕 - 次文本、辅助元素
  terreCuite: '#a13a1e',    // 砖红 - 强调、警告
  bleuPorcelaine: '#88b8ce', // 浅蓝 - 无坏习惯底色
  nuageDeLait: '#fefaf0',   // 奶白 - 页面底色、毛玻璃卡片
  mielDore: '#f1c166',      // 蜜黄 - 选中态、奖励
  
  // 罐头底色（根据坏习惯次数）
  canColors: {
    clean: '#88b8ce',       // 0个 - 浅蓝
    light: '#f1c166',       // 1-10个 - 蜜黄
    medium: '#b79858',      // 11-20个 - 金棕
    heavy: '#a13a1e',       // 20+个 - 砖红
  },
  
  // 毛玻璃效果
  glassmorphism: {
    light: 'rgba(254, 250, 240, 0.8)',  // 奶白半透明
    dark: 'rgba(84, 41, 22, 0.8)',      // 深棕半透明
    accent: 'rgba(241, 193, 102, 0.6)', // 蜜黄半透明
  },
  
  // 阴影
  shadows: {
    card: '0 2px 8px rgba(84, 41, 22, 0.15)',
    elevated: '0 4px 12px rgba(84, 41, 22, 0.08)',
    overlay: 'rgba(84, 41, 22, 0.3)',
  },
} as const;

// 根据背景色自动选择文字颜色（确保对比度）
export const getTextColor = (bgColor: string): string => {
  const lightBgs = [HABIT_CAN_COLORS.bleuPorcelaine, HABIT_CAN_COLORS.nuageDeLait, HABIT_CAN_COLORS.mielDore];
  return lightBgs.includes(bgColor) ? HABIT_CAN_COLORS.espresso : HABIT_CAN_COLORS.nuageDeLait;
};

// 获取罐头颜色
export const getCanColorByCount = (count: number): string => {
  if (count === 0) return HABIT_CAN_COLORS.canColors.clean;
  if (count <= 10) return HABIT_CAN_COLORS.canColors.light;
  if (count <= 20) return HABIT_CAN_COLORS.canColors.medium;
  return HABIT_CAN_COLORS.canColors.heavy;
};

