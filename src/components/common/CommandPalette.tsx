import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  GitCommit, 
  FileText, 
  Settings, 
  X, 
  FileImage 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserReports } from '../../services/reports';
import { FloodReport } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>('');
  const [reports, setReports] = useState<FloodReport[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const fetchReports = async () => {
        try {
          const uid = currentUser?.uid || 'demo_user_123';
          const data = await getUserReports(uid);
          setReports(data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchReports();
    } else {
      setQuery('');
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredReports = reports.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) ||
    r.location.address.toLowerCase().includes(query.toLowerCase()) ||
    r.id.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const quickActions = [
    { label: 'Submit New Disaster Evidence', icon: Plus, path: '/submit', category: 'Actions' },
    { label: 'Evidence Command Center (Dashboard)', icon: ShieldCheck, path: '/', category: 'Navigation' },
    { label: 'Active Investigations Queue', icon: FileText, path: '/investigations', category: 'Navigation' },
    { label: 'Geographic GIS Telemetry Map', icon: MapPin, path: '/map', category: 'Navigation' },
    { label: 'Proof Chain & Audit Logs', icon: GitCommit, path: '/timeline', category: 'Navigation' },
    { label: 'Certified Evidence Reports', icon: FileText, path: '/reports', category: 'Navigation' },
    { label: 'System Diagnostics & APIs', icon: Settings, path: '/settings', category: 'Settings' },
  ].filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-2xl bg-[#0d1117] border border-[#30363d] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="relative border-b border-[#21262d] flex items-center px-4 py-3">
          <Search className="w-4 h-4 text-[#6e7681] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search cases, or jump to page..."
            className="w-full bg-transparent text-sm text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-[#6e7681] hover:text-[#f0f6fc] hover:bg-[#161b22] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4 text-xs font-mono">
          
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#6e7681] tracking-wider">
                Quick Navigation &amp; Commands
              </div>
              <div className="space-y-0.5">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(action.path)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#f0f6fc] hover:bg-[#161b22] hover:text-[#00f2fe] transition group"
                  >
                    <div className="flex items-center gap-2.5 font-sans font-medium text-xs">
                      <action.icon className="w-4 h-4 text-[#8b949e] group-hover:text-[#00f2fe]" />
                      <span>{action.label}</span>
                    </div>
                    <span className="text-[10px] text-[#6e7681]">{action.category}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Cases */}
          {filteredReports.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#6e7681] tracking-wider">
                Evidence Cases ({filteredReports.length})
              </div>
              <div className="space-y-0.5">
                {filteredReports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleSelect(`/report/${report.id}`)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#161b22] transition group"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-md">
                      <FileImage className="w-4 h-4 text-[#00f2fe] shrink-0" />
                      <div className="truncate">
                        <span className="font-sans font-medium text-xs text-[#f0f6fc] group-hover:text-[#00f2fe] block truncate">
                          {report.title}
                        </span>
                        <span className="text-[10px] text-[#6e7681] block truncate">
                          {report.location.address}
                        </span>
                      </div>
                    </div>
                    {report.verification && (
                      <span className="font-mono text-[11px] font-bold text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded border border-[#00f2fe]/30">
                        {report.verification.confidenceScore}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {quickActions.length === 0 && filteredReports.length === 0 && (
            <div className="py-8 text-center text-xs text-[#8b949e]">
              No matching commands or cases found.
            </div>
          )}

        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 bg-[#161b22]/50 border-t border-[#21262d] flex items-center justify-between text-[11px] font-mono text-[#6e7681]">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Navigate</span>
            <span>&crarr; Select</span>
            <span>ESC Close</span>
          </div>
          <span>Floodprint OS v1.0</span>
        </div>

      </div>
    </div>
  );
};
