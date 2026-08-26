import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Plus, 
  ChevronRight, 
  Activity, 
  Search, 
  Compass, 
  FileCheck2, 
  RefreshCw,
  Camera,
  Video,
  Mic,
  ArrowUpRight,
  CloudRain
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { EvidenceMap } from '../components/common/EvidenceMap';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'attention'>('all');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = currentUser?.uid || 'demo_user_123';
      const data = await getUserReports(uid);
      setReports(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load flood intelligence records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentUser]);

  // Operational Metrics
  const totalReports = reports.length;

  const verifiedReports = useMemo(() => {
    return reports.filter(r => (r.verification?.confidenceScore || 0) >= 80 || r.status === 'verified');
  }, [reports]);

  const pendingReports = useMemo(() => {
    return reports.filter(r => 
      !r.verification && (r.status === 'pending_verification' || r.status === 'submitted' || r.status === 'ai_analyzed' || r.status === 'weather_verified')
    );
  }, [reports]);

  const attentionReports = useMemo(() => {
    return reports.filter(r => {
      const hasLowConfidence = r.verification && r.verification.confidenceScore < 60;
      const isAnalysisFailed = r.status === 'analysis_failed';
      const hasWarnings = (r.verification?.warnings && r.verification.warnings.length > 0);
      const isFlagged = r.verificationOutcome === 'inconsistent' || r.verificationOutcome === 'inconsistent_evidence';
      return Boolean(hasLowConfidence || isAnalysisFailed || hasWarnings || isFlagged);
    });
  }, [reports]);

  // Average confidence score
  const avgConfidence = useMemo(() => {
    const scored = reports.filter(r => r.verification?.confidenceScore !== undefined || r.overallConfidenceScore !== undefined);
    if (scored.length === 0) return 0;
    const sum = scored.reduce((acc, r) => acc + (r.verification?.confidenceScore ?? r.overallConfidenceScore ?? 0), 0);
    return Math.round(sum / scored.length);
  }, [reports]);

  // Geocoded Coordinates
  const geocodedReports = useMemo(() => {
    return reports.filter(r => 
      typeof r.location.latitude === 'number' && 
      typeof r.location.longitude === 'number' && 
      !(r.location.latitude === 0 && r.location.longitude === 0)
    );
  }, [reports]);

  // Latest Environmental Observation
  const latestWeather = useMemo(() => {
    const withWeather = reports.find(r => r.weatherVerification?.weather);
    return withWeather?.weatherVerification || null;
  }, [reports]);

  // Filtered Reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = report.id.toLowerCase().includes(q);
        const matchesTitle = report.title.toLowerCase().includes(q);
        const matchesDesc = (report.description || '').toLowerCase().includes(q);
        const matchesAddress = (report.location.address || '').toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesDesc && !matchesAddress) return false;
      }

      if (statusFilter === 'verified') {
        const isVer = report.status === 'verified' || (report.verification?.confidenceScore || 0) >= 80;
        if (!isVer) return false;
      } else if (statusFilter === 'pending') {
        const isPend = !report.verification;
        if (!isPend) return false;
      } else if (statusFilter === 'attention') {
        const isAtt = attentionReports.some(a => a.id === report.id);
        if (!isAtt) return false;
      }

      return true;
    });
  }, [reports, searchQuery, statusFilter, attentionReports]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. COMMAND CENTER BANNER */}
      <div className="p-6 rounded-2xl bg-[#0d1117] border border-[#21262d] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Evidence Intelligence Command Center
            </span>
            <span className="text-[11px] font-mono text-[#6e7681]">
              Live Multi-Signal Stream
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#f0f6fc] tracking-tight">
            Environmental Evidence Verification
          </h1>

          <p className="mt-1.5 text-xs sm:text-sm text-[#8b949e] leading-relaxed">
            Multi-signal synthesis engine combining Gemini Vision, HTML5 video frame dynamics, witness voice transcriptions, EXIF hardware sensors, and Open-Meteo historical radar.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest New Evidence</span>
          </Link>

          <Link
            to="/map"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#161b22] hover:bg-[#21262d] text-[#f0f6fc] text-xs font-semibold border border-[#30363d] transition"
          >
            <Compass className="w-4 h-4 text-[#00f2fe]" />
            <span>GIS Map View</span>
          </Link>
        </div>
      </div>

      {/* 2. OPERATIONAL METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        
        {/* Metric 1 */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
          <span className="text-[10px] uppercase text-[#6e7681] block">Total Ingested</span>
          <div className="text-xl font-black text-[#f0f6fc]">{totalReports}</div>
          <span className="text-[10px] text-[#8b949e]">Cases logged</span>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
          <span className="text-[10px] uppercase text-[#10b981] block">High Confidence</span>
          <div className="text-xl font-black text-[#10b981]">{verifiedReports.length}</div>
          <span className="text-[10px] text-[#8b949e]">&ge; 80% score</span>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
          <span className="text-[10px] uppercase text-[#f59e0b] block">In Queue</span>
          <div className="text-xl font-black text-[#f59e0b]">{pendingReports.length}</div>
          <span className="text-[10px] text-[#8b949e]">Processing</span>
        </div>

        {/* Metric 4 */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
          <span className="text-[10px] uppercase text-[#f43f5e] block">Needs Review</span>
          <div className="text-xl font-black text-[#f43f5e]">{attentionReports.length}</div>
          <span className="text-[10px] text-[#8b949e]">Flagged signals</span>
        </div>

        {/* Metric 5 */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
          <span className="text-[10px] uppercase text-[#00f2fe] block">Mapped Coordinates</span>
          <div className="text-xl font-black text-[#00f2fe]">{geocodedReports.length}</div>
          <span className="text-[10px] text-[#8b949e]">GIS telemetry</span>
        </div>

        {/* Metric 6 */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-1">
          <span className="text-[10px] uppercase text-[#f0f6fc] block">Mean Confidence</span>
          <div className="text-xl font-black text-[#f0f6fc]">
            {avgConfidence > 0 ? `${avgConfidence}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-[#8b949e]">Registry index</span>
        </div>

      </div>

      {/* 3. LIVE ENVIRONMENTAL SIGNALS & SPATIAL RADAR PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Environmental Radar Status (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-[#00f2fe]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono">
                  Live Environmental Radar Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">
                Open-Meteo Radar Synced
              </span>
            </div>

            {latestWeather && latestWeather.weather ? (
              <div className="mt-3 grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <span className="text-[#6e7681] text-[10px] block">PRECIPITATION</span>
                  <span className="font-bold text-[#00f2fe] text-sm mt-0.5 block">
                    {latestWeather.weather.precipitation.toFixed(1)} mm/h
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <span className="text-[#6e7681] text-[10px] block">TEMPERATURE</span>
                  <span className="font-bold text-[#f59e0b] text-sm mt-0.5 block">
                    {latestWeather.weather.temperature.toFixed(1)}°C
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                  <span className="text-[#6e7681] text-[10px] block">WIND SPEED</span>
                  <span className="font-bold text-[#f0f6fc] text-sm mt-0.5 block">
                    {latestWeather.weather.windSpeed.toFixed(1)} km/h
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#8b949e]">
                Historical meteorological radar correlation active across active coordinates.
              </p>
            )}
          </div>

          <div className="text-[11px] text-[#6e7681] flex items-center justify-between pt-2 border-t border-[#21262d]">
            <span>Real-time environmental archive cross-reference</span>
            <Link to="/map" className="text-[#00f2fe] hover:underline flex items-center gap-1">
              <span>View spatial overlay</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right: Interactive GIS Telemetry Map Preview (5 cols) */}
        <div className="lg:col-span-5 p-2 rounded-2xl bg-[#0d1117] border border-[#21262d] overflow-hidden">
          <EvidenceMap
            latitude={geocodedReports[0]?.location.latitude || 29.7604}
            longitude={geocodedReports[0]?.location.longitude || -95.3698}
            address={geocodedReports[0]?.location.address}
            height="170px"
          />
        </div>

      </div>

      {/* 4. RECENT INVESTIGATIONS & EVIDENCE TABLE */}
      <div className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-4">
        
        {/* Controls Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#21262d] pb-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00f2fe]" />
            <h2 className="text-sm font-bold text-[#f0f6fc] font-sans">
              Recent Disaster Evidence Investigations
            </h2>
            <span className="text-[11px] font-mono text-[#6e7681] px-2 py-0.2 rounded bg-[#161b22] border border-[#30363d]">
              {filteredReports.length} Cases
            </span>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6e7681] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter cases..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded-lg border border-[#30363d] text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-0.5 rounded transition ${statusFilter === 'all' ? 'bg-[#00f2fe] text-slate-950 font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('verified')}
                className={`px-2.5 py-0.5 rounded transition ${statusFilter === 'verified' ? 'bg-[#10b981] text-white font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
              >
                Verified
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-0.5 rounded transition ${statusFilter === 'pending' ? 'bg-[#f59e0b] text-slate-950 font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('attention')}
                className={`px-2.5 py-0.5 rounded transition ${statusFilter === 'attention' ? 'bg-[#f43f5e] text-white font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
              >
                Review
              </button>
            </div>

            <button
              onClick={fetchReports}
              className="p-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition"
              title="Refresh Cases"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <LoadingState stage="default" message="Loading evidence registry records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReports} />
        ) : filteredReports.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-[#161b22]/40 border border-[#30363d] border-dashed space-y-2">
            <FileCheck2 className="w-8 h-8 text-[#6e7681] mx-auto" />
            <div className="text-xs font-bold text-[#f0f6fc]">No evidence cases found</div>
            <p className="text-[11px] text-[#8b949e] max-w-xs mx-auto">
              Submit your first flood photo, video, or voice statement to initialize analysis.
            </p>
            <div className="pt-2">
              <Link
                to="/submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f2fe] text-slate-950 text-xs font-bold hover:bg-[#38bdf8] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Submit Evidence
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#21262d]">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#21262d] bg-[#161b22] text-[#8b949e] font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Investigation / Claim</th>
                  <th className="py-2.5 px-3.5">Modalities</th>
                  <th className="py-2.5 px-3.5">Location Telemetry</th>
                  <th className="py-2.5 px-3.5">Captured</th>
                  <th className="py-2.5 px-3.5">Confidence</th>
                  <th className="py-2.5 px-3.5 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d] text-[#f0f6fc]">
                {filteredReports.map(report => {
                  const v = report.verification;
                  const items = report.evidenceItems || [];
                  const hasPhoto = items.some(i => i.type === 'image') || report.primaryImageUrl;
                  const hasVideo = items.some(i => i.type === 'video');
                  const hasAudio = items.some(i => i.type === 'audio');

                  return (
                    <tr key={report.id} className="hover:bg-[#161b22]/60 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={report.primaryImageUrl}
                            alt={report.title}
                            className="w-9 h-9 rounded-md object-cover border border-[#30363d] bg-[#07090e] shrink-0"
                          />
                          <div className="truncate max-w-xs">
                            <Link
                              to={`/report/${report.id}`}
                              className="font-bold text-[#f0f6fc] hover:text-[#00f2fe] transition truncate block"
                            >
                              {report.title}
                            </Link>
                            <span className="text-[10px] font-mono text-[#6e7681]">
                              REF: {report.id.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1 text-[#8b949e]">
                          {hasPhoto && (
                            <span className="p-1 rounded bg-[#161b22] text-[#00f2fe] border border-[#30363d]" title="Photo">
                              <Camera className="w-3 h-3" />
                            </span>
                          )}
                          {hasVideo && (
                            <span className="p-1 rounded bg-[#161b22] text-[#00f2fe] border border-[#30363d]" title="Video">
                              <Video className="w-3 h-3" />
                            </span>
                          )}
                          {hasAudio && (
                            <span className="p-1 rounded bg-[#161b22] text-[#f43f5e] border border-[#30363d]" title="Voice Note">
                              <Mic className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[#8b949e] truncate max-w-[180px]">
                        {report.location.address}
                      </td>

                      <td className="py-3 px-3.5 font-mono text-[#8b949e]">
                        {new Date(report.evidenceTimestamp || report.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3.5">
                        {v ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-[#00f2fe]">
                              {v.confidenceScore}%
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase border ${
                              v.confidenceScore >= 80 
                                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                                : v.confidenceScore >= 60 
                                ? 'bg-[#00f2fe]/10 text-[#00f2fe] border-[#00f2fe]/30'
                                : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                            }`}>
                              {v.outcome.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/30">
                            Queue
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-right">
                        <Link
                          to={`/report/${report.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#161b22] hover:bg-[#21262d] text-[#00f2fe] text-xs font-semibold border border-[#30363d] transition"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
