import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopCommandBar } from './TopCommandBar';
import { CommandPalette } from '../common/CommandPalette';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Keyboard shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-[#f0f6fc] font-sans antialiased flex flex-col">
      
      {/* Collapsible Left Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        }`}
      >
        <TopCommandBar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
        
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <footer className="border-t border-[#21262d] bg-[#0d1117] py-4 px-6 text-xs text-[#6e7681] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#8b949e]">FLOODPRINT AI</span>
            <span>&bull;</span>
            <span>Environmental Disaster Evidence Verification Platform</span>
          </div>
          <div className="font-mono text-[11px] text-[#6e7681] flex items-center gap-3">
            <span>Gemini Vision</span>
            <span>&bull;</span>
            <span>Open-Meteo Radar</span>
            <span>&bull;</span>
            <span>Carto GIS</span>
          </div>
        </footer>
      </div>

      {/* Global Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />

    </div>
  );
};
