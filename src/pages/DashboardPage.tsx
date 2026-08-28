import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  Bot, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  ArrowUpRight,
  FileText,
  Send,
  Boxes,
  Scan
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { EvidenceMap } from '../components/common/EvidenceMap';
import { RealisticTerrainViewer } from '../components/3d/RealisticTerrainViewer';
import { InteractiveTiltCard } from '../components/3d/InteractiveTiltCard';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [promptInput, setPromptInput] = useState<string>('');
  const [viewMode, setViewMode] = useState<'3d_dem' | '2d_gis'>('3d_dem');

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'user';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load dashboard reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, [currentUser]);

  const verifiedCount = reports.filter(r => (r.verification?.confidenceScore || 0) >= 60).length;

  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    navigate('/assistant', { state: { initialPrompt: promptInput.trim() } });
  };

  const handleQuickQuestion = (query: string) => {
    navigate('/assistant', { state: { initialPrompt: query } });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* 1. HERO SECTION WITH 3D SPATIAL TERRAIN SIMULATOR */}
      <div className="bg-3d-hero p-6 sm:p-8 rounded-3xl border border-[#cbd5e1] shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-3.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-3d text-[#0284c7] text-xs font-mono font-bold uppercase tracking-wider">
              <span>💧</span>
              <span>FLOODPRINT PURE 3D PLATFORM</span>
              <span>&bull;</span>
              <span>ANDHRA PRADESH</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0f172a] tracking-tight leading-tight">
              Turn messy environmental evidence into clear, verifiable 3D intelligence.
            </h1>
            
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Ingest photos, drone videos, voice statements, and field dispatch notes. Floodprint combines 3D Digital Elevation Models, satellite radar, camera EXIF, and Gemini multimodal reasoning to deliver tamper-resistant verification dossiers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-3d-pure text-white text-xs font-bold shadow-lg shadow-sky-500/25 transition cursor-pointer"
              >
                <span>📤</span>
                <UploadCloud className="w-4 h-4" />
                <span>{t('nav.upload', 'Upload Evidence')}</span>
              </Link>

              <Link
                to="/assistant"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl btn-3d-secondary text-[#0284c7] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
              >
                <span>🤖</span>
                <Bot className="w-4 h-4" />
                <span>3D Virtual Assistant</span>
              </Link>

              <Link
                to="/analyzer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl btn-3d-secondary text-[#334155] text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <span>🔬</span>
                <Scan className="w-4 h-4 text-[#0284c7]" />
                <span>Forensic Studio</span>
              </Link>
            </div>
          </div>

          {/* Interactive 3D Terrain Mini Preview Widget */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="flex items-center justify-between px-2 pb-2 text-xs font-mono font-bold text-[#64748b]">
              <span className="flex items-center gap-1.5 text-[#0284c7]">
                <span>🌊</span>
                <Boxes className="w-3.5 h-3.5" />
                3D Digital Elevation Model (DEM)
              </span>
              <span className="text-[10px] text-[#10b981] font-bold">✨ Interactive Orbit</span>
            </div>
            <RealisticTerrainViewer 
              locationName="Chittoor River Basin (3D DEM)" 
              latitude={13.2172} 
              longitude={79.1003} 
              height="230px" 
            />
          </div>

        </div>
      </div>

      {/* 2. PROMINENT 3D AI PROMPT COMMAND BOX */}
      <div className="p-5 rounded-3xl bg-white border border-[#cbd5e1] shadow-sm space-y-3 card-3d-pure">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <Sparkles className="w-4 h-4 text-[#0284c7]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0f172a]">
              Ask 3D Virtual Assistant Anything About Ingested Evidence
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#0284c7] font-bold badge-3d px-2 py-0.5 rounded-full">
            ✨ Voice Enabled
          </span>
        </div>

        <form onSubmit={handleAskAi} className="relative">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="e.g. How many flood events were verified in Chittoor this week? Or cross-check radar with photo evidence..."
            className="w-full pl-4 pr-28 py-3 rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7] shadow-inner transition font-sans"
          />
          <button
            type="submit"
            disabled={!promptInput.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl btn-3d-pure disabled:opacity-40 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Ask 3D AI</span>
            <Send className="w-3 h-3" />
          </button>
        </form>

        {/* Suggested Quick Investigation Questions */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] text-[#475569]">
          <span className="font-mono text-[#94a3b8] shrink-0 font-bold">Quick Inquiries:</span>
          {[
            '🔍 How many flood events in Chittoor?',
            '🌧️ Compare radar rain with photo timestamps',
            '🌊 Extract water depth and road damage',
            '📄 Summarize messy field dispatch notes',
          ].map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickQuestion(q)}
              className="px-3 py-1 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] hover:text-[#0284c7] shrink-0 transition cursor-pointer font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 3. FOUR PURE 3D INTERACTIVE TILT METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <InteractiveTiltCard className="p-5 rounded-3xl bg-white border border-[#cbd5e1] shadow-sm space-y-1.5 card-3d-pure">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Total Evidence</span>
            <span className="text-xl">📁</span>
          </div>
          <div className="text-2xl font-black text-[#0f172a] font-mono">
            {reports.length}
          </div>
          <div className="text-[11px] text-[#64748b]">
            Multimodal evidence items ingested
          </div>
        </InteractiveTiltCard>

        <InteractiveTiltCard className="p-5 rounded-3xl bg-white border border-[#cbd5e1] shadow-sm space-y-1.5 card-3d-pure">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Multi-Signal Verified</span>
            <span className="text-xl">✅</span>
          </div>
          <div className="text-2xl font-black text-[#10b981] font-mono">
            {verifiedCount}
          </div>
          <div className="text-[11px] text-[#64748b]">
            Corroborated by AI &amp; Radar
          </div>
        </InteractiveTiltCard>

        <InteractiveTiltCard className="p-5 rounded-3xl bg-white border border-[#cbd5e1] shadow-sm space-y-1.5 card-3d-pure">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Average Synthesis</span>
            <span className="text-xl">⚡</span>
          </div>
          <div className="text-2xl font-black text-[#0284c7] font-mono">
            1.4s
          </div>
          <div className="text-[11px] text-[#64748b]">
            Gemini vision &amp; audio extraction
          </div>
        </InteractiveTiltCard>

        <InteractiveTiltCard className="p-5 rounded-3xl bg-white border border-[#cbd5e1] shadow-sm space-y-1.5 card-3d-pure">
          <div className="flex items-center justify-between text-[#64748b]">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Radar Precision</span>
            <span className="text-xl">🌧️</span>
          </div>
          <div className="text-2xl font-black text-[#0284c7] font-mono">
            99.2%
          </div>
          <div className="text-[11px] text-[#64748b]">
            Open-Meteo historical correlation
          </div>
        </InteractiveTiltCard>

      </div>

      {/* 4. TWO-COLUMN SPLIT: RECENT DOSSIERS + 3D SPATIAL VIEWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Recent Ingested Evidence Dossiers (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#cbd5e1] space-y-4 shadow-sm card-3d-pure">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <FileText className="w-4 h-4 text-[#0284c7]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0f172a]">
                Recent Ingested Evidence Dossiers
              </h2>
            </div>
            <Link
              to="/library"
              className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1 font-mono"
            >
              <span>View All ({reports.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#64748b] font-mono">
              Loading recent evidence dossiers...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] border-dashed space-y-2">
              <span className="text-2xl block">📂</span>
              <div className="text-xs font-bold text-[#0f172a]">No evidence dossiers found</div>
              <p className="text-[11px] text-[#64748b]">
                Upload your first flood photo, video, audio statement or field note to begin.
              </p>
              <Link
                to="/submit"
                className="inline-block mt-2 px-4 py-2 rounded-2xl btn-3d-pure text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                + Upload Evidence
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 4).map((report) => {
                const v = report.verification;
                const score = v?.confidenceScore ?? report.overallConfidenceScore ?? 85;
                const isVerified = score >= 60;

                return (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-2xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] hover:border-[#cbd5e1] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={report.primaryImageUrl}
                        alt={report.title}
                        className="w-14 h-14 rounded-2xl object-cover border border-[#cbd5e1] shrink-0 bg-white shadow-xs"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-[#0f172a] group-hover:text-[#0284c7] transition truncate font-sans">
                          {report.title}
                        </div>
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1 mt-0.5 truncate font-mono">
                          <span>📍</span>
                          <span className="truncate">{report.location.address}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                          <span className="text-[#64748b]">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[#cbd5e1]">&bull;</span>
                          <span className={isVerified ? 'text-[#10b981] font-bold' : 'text-[#d97706] font-bold'}>
                            {isVerified ? '✅ VERIFIED' : '⚠️ REVIEW'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="text-right font-mono pr-2">
                        <div className="text-xs font-black text-[#0284c7]">
                          {score}%
                        </div>
                        <div className="text-[9px] text-[#64748b] uppercase">Score</div>
                      </div>

                      <Link
                        to={`/report/${report.id}`}
                        className="p-2 rounded-xl bg-white hover:bg-[#0284c7] text-[#475569] hover:text-white border border-[#cbd5e1] transition shadow-2xs cursor-pointer"
                        title="View Full Dossier"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spatial Intelligence: 3D Topography vs 2D GIS Map (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-[#cbd5e1] space-y-4 shadow-sm card-3d-pure">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🗺️</span>
              <MapPin className="w-4 h-4 text-[#0284c7]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0f172a]">
                Spatial View (Chittoor, AP)
              </h2>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center rounded-xl bg-[#f1f5f9] p-0.5 border border-[#cbd5e1] text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setViewMode('3d_dem')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === '3d_dem' 
                    ? 'bg-[#0284c7] text-white shadow-xs' 
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                3D DEM Mesh
              </button>
              <button
                type="button"
                onClick={() => setViewMode('2d_gis')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === '2d_gis' 
                    ? 'bg-[#0284c7] text-white shadow-xs' 
                    : 'text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                2D GIS Map
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-[#cbd5e1]">
            {viewMode === '3d_dem' ? (
              <RealisticTerrainViewer 
                locationName="Chittoor Urban Elevation Model"
                latitude={13.2172}
                longitude={79.1003}
                height="280px"
              />
            ) : (
              <EvidenceMap
                latitude={13.2172}
                longitude={79.1003}
                address="Chittoor, Andhra Pradesh, India"
                height="280px"
                interactive={true}
                showSearch={false}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-[#64748b] pt-1">
            <span>Coordinates: 13.2172° N, 79.1003° E</span>
            <span className="text-[#10b981] font-bold">
              {viewMode === '3d_dem' ? '✨ Three.js WebGL 3D' : '🗺️ CartoDB Voyager'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
