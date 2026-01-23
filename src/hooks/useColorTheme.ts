import { useMemo } from 'react';

interface ColorTheme {
  bgColor: string;
  textColor: string;
  accentColor: string;
  cardBg: string;
  buttonBg: string;
  borderColor: string;
  isDark: boolean;
}

export function useColorTheme(bgColor: string): ColorTheme {
  return useMemo(() => {
    // 判断颜色是否为深色
    const isColorDark = (color: string): boolean => {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    };

    const isDark = isColorDark(bgColor);

    return {
      bgColor,
      textColor: isDark ? '#ffffff' : '#000000',
      accentColor: isDark ? 'rgba(255,255,255,0.7)' : '#666666',
      cardBg: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      buttonBg: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
      isDark,
    };
  }, [bgColor]);
}

