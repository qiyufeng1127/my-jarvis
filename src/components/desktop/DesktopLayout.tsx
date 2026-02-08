import React, { useState } from 'react';
import { DesktopSidebar, DesktopTopBar } from '@/components/desktop';
import type { SidebarItem } from './DesktopSidebar';
import './DesktopLayout.css';

interface DesktopLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  activeItemId: string;
  onItemClick: (id: string) => void;
  userName?: string;
  userAvatar?: string;
  level?: number;
  coins?: number;
  notifications?: number;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  children,
  sidebarItems,
  activeItemId,
  onItemClick,
  userName,
  userAvatar,
  level,
  coins,
  notifications,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="desktop-layout">
      {/* Sidebar */}
      <DesktopSidebar
        items={sidebarItems}
        activeId={activeItemId}
        onItemClick={onItemClick}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`desktop-layout__main ${sidebarCollapsed ? 'desktop-layout__main--expanded' : ''}`}>
        {/* Top Bar */}
        <DesktopTopBar
          userName={userName}
          userAvatar={userAvatar}
          level={level}
          coins={coins}
          notifications={notifications}
        />

        {/* Content */}
        <main className="desktop-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
};

