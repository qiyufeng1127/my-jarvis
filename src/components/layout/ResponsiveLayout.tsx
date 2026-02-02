import { useState, useEffect } from 'react';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';
import MobileLayout from './MobileLayout';

interface ResponsiveLayoutProps {
  onOpenAISmart?: () => void;
}

export default function ResponsiveLayout({ onOpenAISmart }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 检测设备类型
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // 手机端使用 MobileLayout
  if (isMobile) {
    return <MobileLayout />;
  }

  // 电脑端使用 CustomizableDashboard
  return <CustomizableDashboard onOpenAISmart={onOpenAISmart} />;
}














