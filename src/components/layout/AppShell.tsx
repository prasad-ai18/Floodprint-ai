import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopCommandBar } from './TopCommandBar';
import { Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If on login/signup route, render without navigation shell
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  if (isAuthRoute || !currentUser) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-environmental-pattern text-[#0f172a] font-sans antialiased">
      
      {/* Desktop Navigation Sidebar */}
      <div className="hidden lg:block w-64 h-full shrink-0 z-20">
        <Sidebar />
      </div>

      {/* Mobile Drawer Navigation Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs h-full bg-white z-10 shadow-2xl flex flex-col">
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main App Workspace */}
      <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
        
        {/* Top Command Bar */}
        <TopCommandBar 
          onOpenCommandPalette={() => {}} 
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

      {/* Floating 🤖 FLOODPRINT AI Trigger on All Views (except /chat) */}
      {location.pathname !== '/chat' && (
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            to="/chat"
            className="group flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 transition-all duration-200 active:scale-95 border border-white/20"
            title="Open Floodprint AI Assistant"
          >
            <div className="relative">
              <Bot className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0284c7] animate-pulse" />
            </div>
            <span className="text-xs font-bold font-mono tracking-wide flex items-center gap-1.5">
              <span>🤖 FLOODPRINT AI</span>
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
            </span>
          </Link>
        </div>
      )}

    </div>
  );
};
