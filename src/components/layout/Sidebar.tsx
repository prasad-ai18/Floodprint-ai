import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  PlusCircle, 
  MapPin, 
  GitCommit, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse, onToggle }) => {
  const { currentUser, logout, isDemoMode } = useAuth();
  const toggleHandler = onToggleCollapse || onToggle || (() => {});

  const navItems = [
    { label: 'Dashboard', to: '/', icon: Activity, badge: 'Live' },
    { label: 'Submit Evidence', to: '/submit', icon: PlusCircle, highlight: true },
    { label: 'Investigations', to: '/investigations', icon: ShieldCheck },
    { label: 'Spatial GIS Map', to: '/map', icon: MapPin },
    { label: 'Proof Chain & Logs', to: '/timeline', icon: GitCommit },
    { label: 'Certified Reports', to: '/reports', icon: FileCheck2 },
    { label: 'System Diagnostics', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-[#21262d] bg-[#0d1117] transition-all duration-300 z-40 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-[#21262d]">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] shadow-md shadow-cyan-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-mono font-black text-sm tracking-wider text-[#f0f6fc]">
                FLOODPRINT
              </span>
              <span className="text-[10px] font-mono text-[#00f2fe] uppercase tracking-widest leading-none">
                AI Evidence OS
              </span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={toggleHandler}
          className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22] border border-transparent hover:border-[#30363d] transition"
          title={collapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Real-time Status Badge */}
      {!collapsed && (
        <div className="px-4 py-2.5 mx-3 mt-3 rounded-xl bg-[#161b22] border border-[#21262d] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
            </span>
            <span className="text-[#8b949e] text-[11px]">Engine Status</span>
          </div>
          <span className="text-[#10b981] font-semibold text-[11px]">ONLINE</span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                  isActive
                    ? 'bg-[#161b22] text-[#00f2fe] font-bold border border-[#30363d] shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]/60'
                } ${item.highlight && !collapsed ? 'mt-2 mb-2 bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border-cyan-800/40 text-cyan-300' : ''}`
              }
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${item.highlight ? 'text-[#00f2fe]' : ''}`} />
              {!collapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile & Demo Mode Indicator */}
      <div className="p-3 border-t border-[#21262d] space-y-2">
        {isDemoMode && !collapsed && (
          <div className="px-2.5 py-1.5 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20 text-[10px] font-mono text-[#f59e0b] flex items-center justify-between">
            <span>DEMO MODE</span>
            <span className="text-[9px] uppercase text-[#8b949e]">Dev Proxy</span>
          </div>
        )}

        <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#161b22] border border-[#21262d]">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00f2fe] to-indigo-600 flex items-center justify-center text-slate-950 font-black text-xs shrink-0">
              {currentUser?.email?.[0]?.toUpperCase() || 'V'}
            </div>
            {!collapsed && (
              <div className="truncate text-left">
                <div className="text-xs font-semibold text-[#f0f6fc] truncate leading-tight">
                  {currentUser?.displayName || 'Lead Verifier'}
                </div>
                <div className="text-[10px] font-mono text-[#6e7681] truncate leading-tight">
                  {currentUser?.email || 'verifier@floodprint.ai'}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#f43f5e] transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
