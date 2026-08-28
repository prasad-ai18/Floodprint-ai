import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bot, 
  MapPin, 
  Clock, 
  LogOut, 
  Menu,
  CloudRain,
  Radio,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface TopCommandBarProps {
  onOpenCommandPalette: () => void;
  onOpenMobileSidebar?: () => void;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({ 
  onOpenMobileSidebar 
}) => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Dynamic Asia/Kolkata (IST) Live Clock
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [timezoneLabel, setTimezoneLabel] = useState<string>('IST');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const dateFormatted = new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        }).format(now);

        const timeFormatted = new Intl.DateTimeFormat('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }).format(now);

        setCurrentDateStr(dateFormatted);
        setCurrentTimeStr(timeFormatted);
        setTimezoneLabel('IST');
      } catch {
        setCurrentDateStr(now.toLocaleDateString());
        setCurrentTimeStr(now.toLocaleTimeString());
        setTimezoneLabel('IST');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const userEmail = currentUser?.email || 'officer@floodprint.gov.in';

  return (
    <header className="h-16 border-b border-[#cbd5e1] bg-white/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-sm">
      
      {/* Left: Mobile Nav & Brand Subtitle */}
      <div className="flex items-center gap-3 text-xs">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] border border-transparent transition cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-sm tracking-tight text-[#0284c7] flex items-center gap-1.5">
            <span>💧</span>
            <span>FLOODPRINT</span>
          </span>
          <span className="hidden md:inline-block text-[#94a3b8]">&bull;</span>
          <span className="hidden md:inline-block text-[11px] font-bold text-[#475569] tracking-wide uppercase font-mono">
            {t('brand.subtitle', '3D AI Evidence Platform')}
          </span>
        </div>
      </div>

      {/* Center/Right: Live Telemetry, Language, Weather, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Active Geographic Hub */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#cbd5e1] text-xs font-medium text-[#334155] shadow-xs">
          <span>📍</span>
          <MapPin className="w-3.5 h-3.5 text-[#0284c7]" />
          <span>Chittoor, AP, India</span>
        </div>

        {/* Real-time IST Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#cbd5e1] text-xs font-mono text-[#0f172a] shadow-xs">
          <span>📅</span>
          <span className="font-bold">{currentDateStr}</span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <span>🕐</span>
          <Clock className="w-3.5 h-3.5 text-[#0284c7]" />
          <span className="text-[#475569] font-medium">{currentTimeStr}</span>
          <span className="text-[10px] text-[#0284c7] font-bold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 font-mono">
            {timezoneLabel}
          </span>
        </div>

        {/* Environmental Context Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#cbd5e1] text-xs font-medium text-[#334155] shadow-xs">
          <span>🌧️</span>
          <CloudRain className="w-3.5 h-3.5 text-[#0284c7]" />
          <span className="font-mono text-[#0f172a] font-bold">24 mm/h</span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <Radio className="w-3 h-3 text-[#10b981] animate-pulse" />
          <span className="text-[#10b981] font-bold text-[11px]">Radar Live</span>
        </div>

        {/* Language Selector: EN | తెలుగు | हिन्दी */}
        <div className="flex items-center rounded-xl bg-[#f1f5f9] p-0.5 border border-[#cbd5e1] text-[11px] font-bold font-mono">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'en' ? 'bg-white text-[#0284c7] shadow-xs font-bold' : 'text-[#64748b] hover:text-[#0f172a]'}`}
            title="English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('te')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'te' ? 'bg-white text-[#0284c7] shadow-xs font-bold' : 'text-[#64748b] hover:text-[#0f172a]'}`}
            title="తెలుగు"
          >
            తెలుగు
          </button>
          <button
            onClick={() => setLanguage('hi')}
            className={`px-2 py-1 rounded-lg transition cursor-pointer ${language === 'hi' ? 'bg-white text-[#0284c7] shadow-xs font-bold' : 'text-[#64748b] hover:text-[#0f172a]'}`}
            title="हिन्दी"
          >
            हिन्दी
          </button>
        </div>

        {/* 3D Virtual Assistant Quick Trigger */}
        <Link
          to="/assistant"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl btn-3d-pure text-white text-xs font-bold shadow-md shadow-sky-500/25 transition active:scale-95 cursor-pointer"
        >
          <span>🤖</span>
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">3D Assistant</span>
          <Sparkles className="w-3 h-3 text-sky-200" />
        </Link>

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-2 pl-1 border-l border-[#cbd5e1]">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] flex items-center justify-center text-white font-bold text-xs shrink-0 font-mono shadow-xs">
            {userEmail[0].toUpperCase()}
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-xl hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#e11d48] transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </header>
  );
};
