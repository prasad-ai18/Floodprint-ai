import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Bot, 
  MapPin, 
  FileText, 
  Settings, 
  ShieldCheck, 
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const navItems = [
    {
      label: t('nav.dashboard', 'Dashboard'),
      path: '/',
      icon: LayoutDashboard,
      emoji: '📊',
    },
    {
      label: t('nav.upload', 'Upload Evidence'),
      path: '/submit',
      icon: UploadCloud,
      emoji: '📤',
    },
    {
      label: t('nav.chat', 'AI Assistant'),
      path: '/chat',
      icon: Bot,
      emoji: '🤖',
      badge: 'PRO',
    },
    {
      label: t('nav.map', 'GIS Spatial Map'),
      path: '/map',
      icon: MapPin,
      emoji: '🗺️',
    },
    {
      label: t('nav.library', 'Evidence Library'),
      path: '/library',
      icon: FileText,
      emoji: '📁',
    },
    {
      label: t('nav.settings', 'System Status'),
      path: '/settings',
      icon: Settings,
      emoji: '⚙️',
    },
  ];

  const userEmail = currentUser?.email || 'officer@floodprint.gov.in';
  const roleName = userProfile?.role ? userProfile.role.toUpperCase() : 'VERIFIER';

  return (
    <aside className="w-full h-full bg-white border-r border-[#e2e8f0] flex flex-col justify-between p-4 select-none font-sans shadow-xs">
      
      {/* Brand Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white shadow-md shadow-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-base tracking-tight text-[#0f172a] font-mono flex items-center gap-1.5">
                <span>💧</span>
                <span>FLOODPRINT</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#0284c7] font-mono">
                AI Evidence Platform
              </div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#0284c7] text-white shadow-md shadow-sky-500/20'
                    : 'text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{item.emoji}</span>
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-sky-100 text-[#0284c7] border border-sky-200">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Session Footer & Sign Out */}
      <div className="pt-4 border-t border-[#e2e8f0] space-y-3">
        <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white flex items-center justify-center font-bold text-xs shrink-0 font-mono shadow-xs">
              {userEmail[0].toUpperCase()}
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-[#0f172a] truncate font-mono">
                {userEmail.split('@')[0]}
              </div>
              <div className="text-[10px] text-[#64748b] truncate font-mono uppercase">
                {roleName} &bull; AP Hub
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl text-[#64748b] hover:text-[#e11d48] hover:bg-rose-50 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};
