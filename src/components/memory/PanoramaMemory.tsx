import DiarySystem from './DiarySystem';

interface PanoramaMemoryProps {
  isDark?: boolean;
  bgColor?: string;
}

export default function PanoramaMemory({ isDark = false, bgColor = '#ffffff' }: PanoramaMemoryProps) {
  // 直接显示日记系统，不需要原来的记忆列表首页
  return <DiarySystem isDark={isDark} bgColor={bgColor} />;
}

