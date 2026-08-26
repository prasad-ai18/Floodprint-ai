import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Camera, 
  Video, 
  Mic, 
  MapPin, 
  Plus, 
  Bot, 
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { LoadingState } from '../components/common/LoadingState';

export const EvidenceLibraryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');

  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'user';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load evidence library:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [currentUser]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesAddress = r.location.address.toLowerCase().includes(q);
        const matchesDesc = (r.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesAddress && !matchesDesc) return false;
      }

      const items = r.evidenceItems || [];
      if (typeFilter === 'image') {
        const hasImg = items.some(e => e.type === 'image') || Boolean(r.primaryImageUrl);
        if (!hasImg) return false;
      } else if (typeFilter === 'video') {
        const hasVid = items.some(e => e.type === 'video');
        if (!hasVid) return false;
      } else if (typeFilter === 'audio') {
        const hasAud = items.some(e => e.type === 'audio');
        if (!hasAud) return false;
      } else if (typeFilter === 'document') {
        const hasDoc = items.some(e => e.type === 'text') || (r.description && r.description.length > 50);
        if (!hasDoc) return false;
      }

      return true;
    });
  }, [reports, searchQuery, typeFilter]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0284c7]/10 border border-[#0284c7]/20 text-[#0284c7] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <span>📁</span>
            <Layers className="w-3.5 h-3.5" />
            <span>Evidence Repository &amp; Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
            {t('nav.library', 'Evidence Library')}
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Central repository of all ingested disaster evidence, multimodal files, metadata extractions, and certified dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#f1f5f9] text-[#0284c7] border border-[#cbd5e1] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <span>🤖</span>
            <Bot className="w-4 h-4" />
            <span>AI Assistant</span>
          </Link>

          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-md shadow-sky-500/20 cursor-pointer active:scale-95"
          >
            <span>📤</span>
            <Plus className="w-4 h-4" />
            <span>Upload Evidence</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, location address, or keywords..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
          />
        </div>

        {/* Filter Chips with Selective Emojis */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold font-mono">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${typeFilter === 'all' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0]'}`}
          >
            All ({reports.length})
          </button>
          <button
            onClick={() => setTypeFilter('image')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${typeFilter === 'image' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0]'}`}
          >
            <span>🖼️</span>
            <Camera className="w-3.5 h-3.5" />
            <span>Photos</span>
          </button>
          <button
            onClick={() => setTypeFilter('video')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${typeFilter === 'video' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0]'}`}
          >
            <span>🎥</span>
            <Video className="w-3.5 h-3.5" />
            <span>Videos</span>
          </button>
          <button
            onClick={() => setTypeFilter('audio')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${typeFilter === 'audio' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0]'}`}
          >
            <span>🎙️</span>
            <Mic className="w-3.5 h-3.5" />
            <span>Audio</span>
          </button>
          <button
            onClick={() => setTypeFilter('document')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${typeFilter === 'document' ? 'bg-[#0284c7] text-white shadow-xs' : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#e2e8f0]'}`}
          >
            <span>📄</span>
            <FileText className="w-3.5 h-3.5" />
            <span>Documents</span>
          </button>
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <LoadingState stage="default" message="Loading evidence library registry..." />
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#e2e8f0] border-dashed space-y-3 shadow-sm">
          <span className="text-3xl block">📂</span>
          <h3 className="text-sm font-bold text-[#0f172a]">No evidence found yet</h3>
          <p className="text-xs text-[#64748b] max-w-sm mx-auto">
            Upload environmental evidence to begin building your forensic dossier.
          </p>
          <Link
            to="/submit"
            className="inline-flex items-center gap-1.5 mt-2 px-5 py-2.5 rounded-xl bg-[#0284c7] text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer active:scale-95"
          >
            <span>📤</span>
            <span>Upload Evidence</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const v = report.verification;
            const items = report.evidenceItems || [];
            const hasPhoto = items.some(i => i.type === 'image') || Boolean(report.primaryImageUrl);
            const hasVideo = items.some(i => i.type === 'video');
            const hasAudio = items.some(i => i.type === 'audio');
            const hasDoc = items.some(i => i.type === 'text');

            return (
              <div
                key={report.id}
                className="p-5 rounded-3xl bg-white border border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-md transition space-y-4 flex flex-col justify-between group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border border-[#e2e8f0] bg-[#f8fafc] h-44">
                    <img
                      src={report.primaryImageUrl}
                      alt={report.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-[#0284c7] border border-[#e2e8f0] font-bold shadow-xs">
                      {hasPhoto && <span>🖼️</span>}
                      {hasVideo && <span>🎥</span>}
                      {hasAudio && <span>🎙️</span>}
                      {hasDoc && <span>📄</span>}
                      <span>{items.length || 1} Modalities</span>
                    </div>

                    {v && (
                      <div className="absolute top-2.5 right-2.5 bg-white/95 px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-[#0284c7] border border-[#e2e8f0] shadow-xs">
                        {v.confidenceScore}% SCORE
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0f172a] group-hover:text-[#0284c7] transition line-clamp-1 font-sans">
                      {report.title}
                    </h3>
                    <p className="text-xs text-[#64748b] line-clamp-2 mt-1">
                      {v?.explanation || report.description || 'Disaster evidence dossier.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#e2e8f0] text-xs">
                  <div className="flex items-center gap-1.5 text-[#64748b] truncate font-mono text-[11px]">
                    <span>📍</span>
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0284c7]" />
                    <span className="truncate">{report.location.address}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#94a3b8]">
                    <span>📅 {new Date(report.evidenceTimestamp || report.createdAt).toLocaleDateString()}</span>
                    <span className="text-[#10b981] font-bold uppercase">
                      ✅ {report.verificationOutcome || 'Verified'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={`/report/${report.id}`}
                      className="py-1.5 rounded-xl bg-white hover:bg-[#f8fafc] text-xs font-bold text-[#0f172a] border border-[#cbd5e1] text-center transition shadow-2xs cursor-pointer"
                    >
                      Dossier
                    </Link>
                    <button
                      onClick={() => navigate('/chat', { state: { reportId: report.id } })}
                      className="py-1.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                    >
                      <span>🤖</span>
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
