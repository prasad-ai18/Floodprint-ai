import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Search, 
  ChevronRight, 
  Plus, 
  Activity, 
  Camera, 
  Video, 
  Mic, 
  ArrowUpDown 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { LoadingState } from '../components/common/LoadingState';

export const InvestigationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'confidence'>('date');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'demo_user_123';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load investigations:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentUser]);

  const filteredReports = useMemo(() => {
    let list = reports.filter(r => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = r.title.toLowerCase().includes(q) || 
                        r.location.address.toLowerCase().includes(q) ||
                        r.id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter === 'verified') {
        return (r.verification?.confidenceScore || 0) >= 80 || r.status === 'verified';
      }
      if (statusFilter === 'pending') {
        return !r.verification;
      }
      if (statusFilter === 'attention') {
        return (r.verification && r.verification.confidenceScore < 60) || r.verificationOutcome === 'inconsistent';
      }
      return true;
    });

    if (sortBy === 'confidence') {
      list.sort((a, b) => (b.verification?.confidenceScore || 0) - (a.verification?.confidenceScore || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [reports, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Forensic Queue
          </div>
          <h1 className="text-2xl font-black text-[#f0f6fc] tracking-tight">
            Active Investigations
          </h1>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Audit queue of all multimodal flood disaster cases undergoing verification, environmental cross-check, and AI synthesis.
          </p>
        </div>

        <Link
          to="/submit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#6e7681] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by case title, location, or case ID..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          
          <div className="flex items-center gap-1 bg-[#161b22] p-1 rounded-lg border border-[#30363d] text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-semibold transition ${statusFilter === 'all' ? 'bg-[#00f2fe] text-slate-950 font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
            >
              All ({reports.length})
            </button>
            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-2.5 py-1 rounded font-semibold transition ${statusFilter === 'verified' ? 'bg-[#10b981] text-white font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
            >
              Verified
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded font-semibold transition ${statusFilter === 'pending' ? 'bg-[#f59e0b] text-slate-950 font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('attention')}
              className={`px-2.5 py-1 rounded font-semibold transition ${statusFilter === 'attention' ? 'bg-[#f43f5e] text-white font-bold' : 'text-[#8b949e] hover:text-[#f0f6fc]'}`}
            >
              Review
            </button>
          </div>

          <button
            onClick={() => setSortBy(sortBy === 'date' ? 'confidence' : 'date')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] hover:text-[#f0f6fc] transition font-mono"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort: {sortBy === 'date' ? 'Recent' : 'Score'}</span>
          </button>

        </div>
      </div>

      {/* Investigations Table */}
      {loading ? (
        <LoadingState stage="default" message="Loading active forensic investigation queue..." />
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d1117] border border-[#21262d] border-dashed space-y-3">
          <Activity className="w-10 h-10 text-[#6e7681] mx-auto" />
          <h3 className="text-sm font-bold text-[#f0f6fc]">No investigations found</h3>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
            No cases match the active filter criteria. Submit a new disaster case or clear filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#21262d] bg-[#0d1117]">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#21262d] bg-[#161b22] text-[#8b949e] font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Case Details</th>
                <th className="py-3 px-4">Evidence Modalities</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Incident Timestamp</th>
                <th className="py-3 px-4">Verification Score</th>
                <th className="py-3 px-4 text-right">Action</th>
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
                  <tr key={report.id} className="hover:bg-[#161b22]/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={report.primaryImageUrl}
                          alt={report.title}
                          className="w-10 h-10 rounded-lg object-cover border border-[#30363d] bg-[#07090e]"
                        />
                        <div className="truncate max-w-xs">
                          <Link
                            to={`/report/${report.id}`}
                            className="font-bold text-[#f0f6fc] hover:text-[#00f2fe] transition truncate block"
                          >
                            {report.title}
                          </Link>
                          <span className="text-[10px] font-mono text-[#6e7681]">
                            ID: {report.id.slice(0, 14)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[#8b949e]">
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
                          <span className="p-1 rounded bg-[#161b22] text-[#f43f5e] border border-[#30363d]" title="Audio">
                            <Mic className="w-3 h-3" />
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#6e7681]">
                          ({items.length || 1})
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[#8b949e] truncate max-w-[200px]">
                      {report.location.address}
                    </td>

                    <td className="py-3 px-4 font-mono text-[#8b949e]">
                      {new Date(report.evidenceTimestamp || report.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4">
                      {v ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[#00f2fe]">
                            {v.confidenceScore}%
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
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
                        <span className="text-[11px] font-mono text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded border border-[#f59e0b]/30">
                          Pending AI
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/report/${report.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-[#00f2fe] text-xs font-semibold border border-[#30363d] transition"
                      >
                        <span>Inspect</span>
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
  );
};
