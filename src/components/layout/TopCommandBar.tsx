import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Clock, 
  ChevronRight
} from 'lucide-react';

interface TopCommandBarProps {
  onOpenCommandPalette: () => void;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  
  // Real-time Clock
  const [currentUtc, setCurrentUtc] = useState<string>('');
  const [currentLocal, setCurrentLocal] = useState<string>('');
  const [timezoneName, setTimezoneName] = useState<string>('');

  useEffect(() => {
    try {
      setTimezoneName(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local');
    } catch {
      setTimezoneName('Local');
    }

    const updateClocks = () => {
      const now = new Date();
      setCurrentUtc(now.toUTCString().slice(17, 25) + ' UTC');
      setCurrentLocal(now.toLocaleTimeString());
    };

    updateClocks();
    const timer = setInterval(updateClocks, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Breadcrumb
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Evidence Command Center';
    if (path === '/submit') return 'Multimodal Ingestion Pipeline';
    if (path.startsWith('/report/')) return 'Forensic Evidence Dossier';
    if (path === '/map') return 'Spatial GIS Telemetry';
    if (path === '/timeline') return 'Proof Chain & Audit Logs';
    if (path === '/investigations') return 'Active Investigations Queue';
    if (path === '/reports') return 'Certified Intelligence Reports';
    if (path === '/settings') return 'System Diagnostics & APIs';
    if (path === '/login') return 'Investigator Authentication';
    return 'Investigation Workspace';
  };

  return (
    <header className="h-14 border-b border-[#21262d] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
      
      {/* Breadcrumb Context */}
      <div className="flex items-center gap-2 text-xs truncate">
        <span className="font-mono text-[#6e7681] uppercase hidden sm:inline">FLOODPRINT</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#30363d] hidden sm:inline" />
        <span className="font-semibold text-[#f0f6fc] truncate">{getBreadcrumb()}</span>
      </div>

      {/* Center Command Search Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="flex-1 max-w-md hidden md:flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#f0f6fc] transition shadow-inner"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#6e7681]" />
          <span>Search cases, locations, timestamps...</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span className="px-1.5 py-0.2 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
            Ctrl
          </span>
          <span className="px-1.5 py-0.2 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e]">
            K
          </span>
        </div>
      </button>

      {/* Right Telemetry & Actions */}
      <div className="flex items-center gap-3">
        
        {/* Real-time System Clocks */}
        <div className="hidden lg:flex items-center gap-3 px-2.5 py-1 rounded-lg bg-[#161b22] border border-[#21262d] text-[11px] font-mono text-[#8b949e]">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00f2fe]" />
            <span className="text-[#f0f6fc] font-bold">{currentLocal}</span>
            <span className="text-[#6e7681] text-[10px]">({timezoneName})</span>
          </div>
          <span className="text-[#30363d]">&bull;</span>
          <span className="text-[#8b949e]">{currentUtc}</span>
        </div>

        {/* Live System Signal Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161b22] border border-[#21262d] text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="text-[#8b949e]">Open-Meteo:</span>
          <span className="text-[#10b981] font-semibold">Active</span>
        </div>

        {/* Mobile Search Icon */}
        <button
          onClick={onOpenCommandPalette}
          className="md:hidden p-2 rounded-lg bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Submit Evidence Quick Button */}
        <Link
          to="/submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00f2fe] to-[#0284c7] hover:from-[#38bdf8] hover:to-[#0369a1] text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/10 transition shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ingest Evidence</span>
        </Link>

      </div>

    </header>
  );
};
