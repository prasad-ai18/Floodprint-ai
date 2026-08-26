import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Search, 
  ChevronRight, 
  MapPin 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { LoadingState } from '../components/common/LoadingState';

export const ReportsHubPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'demo_user_123';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports hub:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentUser]);

  const verifiedReports = reports.filter(r => 
    (r.verification?.confidenceScore || 0) >= 60 || r.status === 'verified'
  );

  const filtered = verifiedReports.filter(r =>
    !searchQuery.trim() ||
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.location.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(verifiedReports, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `floodprint_evidence_registry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            Certified Intelligence
          </div>
          <h1 className="text-2xl font-black text-[#f0f6fc] tracking-tight">
            Evidence Reports &amp; Dossiers
          </h1>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Judge-ready and stakeholder-certified disaster verification reports complete with multi-signal proofs and provenance hashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            disabled={verifiedReports.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#f0f6fc] border border-[#30363d] transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#00f2fe]" />
            <span>Export Registry JSON</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d]">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[#6e7681] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report titles, addresses, or identifiers..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState stage="default" message="Retrieving certified case dossiers..." />
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d1117] border border-[#21262d] border-dashed space-y-3">
          <FileText className="w-10 h-10 text-[#6e7681] mx-auto" />
          <h3 className="text-sm font-bold text-[#f0f6fc]">No certified reports found</h3>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
            Reports with verified multi-signal corroboration will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(report => {
            const v = report.verification;
            return (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] hover:border-[#30363d] transition space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#6e7681] mb-1">
                    <span>DOSSIER: {report.id.slice(0, 12)}...</span>
                    {v && (
                      <span className="font-bold text-[#00f2fe]">
                        {v.confidenceScore}% SCORE
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#f0f6fc] line-clamp-1">
                    {report.title}
                  </h3>

                  <p className="text-xs text-[#8b949e] line-clamp-2 mt-1">
                    {v?.explanation || report.description || 'Verified evidence dossier.'}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-[#21262d] text-xs">
                  <div className="flex items-center gap-1.5 text-[#8b949e] truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#6e7681]" />
                    <span className="truncate">{report.location.address}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#6e7681] font-mono">
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    <span className="text-[#10b981] font-bold uppercase">
                      {report.verificationOutcome || 'Verified'}
                    </span>
                  </div>

                  <Link
                    to={`/report/${report.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#00f2fe] border border-[#30363d] transition"
                  >
                    <span>Open Case Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
