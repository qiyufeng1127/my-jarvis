import { useState, useEffect } from 'react';
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard';
import MobileLayout from './MobileLayout';

interface ResponsiveLayoutProps {
  onOpenAISmart?: () => void;
  onModuleChange?: (module: string) => void;
}

const isMobileDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

export default function ResponsiveLayout({ onOpenAISmart, onModuleChange }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isMobileDevice() || window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    const updateLayoutMode = (matches: boolean) => {
      setIsMobile((current) => {
        const next = isMobileDevice() || matches;
        return current === next ? current : next;
      });
    };

    updateLayoutMode(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      updateLayoutMode(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (isMobile) {
    return <MobileLayout onModuleChange={onModuleChange} />;
  }

  return <CustomizableDashboard onOpenAISmart={onOpenAISmart} onModuleChange={onModuleChange} />;
}
