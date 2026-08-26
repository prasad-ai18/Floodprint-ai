import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Search, 
  ChevronRight, 
  Compass,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { EvidenceMap } from '../components/common/EvidenceMap';
import { LoadingState } from '../components/common/LoadingState';

export const MapPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<FloodReport | null>(null);
  const [filterOutcome, setFilterOutcome] = useState<string>('all');

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'demo_user_123';
        const data = await getUserReports(uid);
        setReports(data);
        if (data.length > 0) {
          setSelectedReport(data[0]);
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentUser]);

  const geocodedReports = reports.filter(r => 
    typeof r.location.latitude === 'number' && 
    typeof r.location.longitude === 'number' && 
    !(r.location.latitude === 0 && r.location.longitude === 0)
  );

  const filteredReports = geocodedReports.filter(r => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = r.title.toLowerCase().includes(q) || r.location.address.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterOutcome !== 'all') {
      const outcome = r.verificationOutcome || r.verification?.outcome || r.status;
      if (outcome !== filterOutcome) return false;
    }
    return true;
  });

  const activeLat = selectedReport?.location.latitude || 29.7604;
  const activeLng = selectedReport?.location.longitude || -95.3698;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            Spatial GIS Intelligence
          </div>
          <h1 className="text-2xl font-black text-[#f0f6fc] tracking-tight">
            Geographic Evidence Map
          </h1>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Real-time geospatial visualization of geocoded disaster claims, EXIF coordinates, and flood impact radius.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8b949e] bg-[#161b22] px-3 py-1.5 rounded-lg border border-[#30363d]">
            Mapped Nodes: <strong className="text-[#00f2fe]">{geocodedReports.length}</strong>
          </span>
          <Link
            to="/submit"
            className="px-3.5 py-1.5 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 text-xs font-bold transition"
          >
            + Add Geocoded Evidence
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingState stage="default" message="Loading spatial GIS layers and coordinate markers..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Map View (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-1 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl">
              <EvidenceMap
                latitude={activeLat}
                longitude={activeLng}
                address={selectedReport?.location.address}
                locationSource={selectedReport?.location.locationSource}
                height="560px"
              />
            </div>

            {/* Selected Location Card */}
            {selectedReport && (
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#8b949e]">
                    <span>LAT: {selectedReport.location.latitude.toFixed(6)}</span>
                    <span>&bull;</span>
                    <span>LON: {selectedReport.location.longitude.toFixed(6)}</span>
                    <span className="px-2 py-0.5 rounded bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                      {selectedReport.location.locationSource || 'GPS'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#f0f6fc] mt-1">
                    {selectedReport.location.address}
                  </h3>
                </div>

                <Link
                  to={`/report/${selectedReport.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#00f2fe] border border-[#30363d] transition shrink-0"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Inspect Forensic Case</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Side Case Selector (4 cols) */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0d1117] border border-[#30363d] space-y-4">
            
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6e7681] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter locations or titles..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
                />
              </div>

              <select
                value={filterOutcome}
                onChange={(e) => setFilterOutcome(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] focus:outline-none"
              >
                <option value="all">All Verification Statuses</option>
                <option value="verified">Verified Cases</option>
                <option value="partially_verified">Partially Verified</option>
                <option value="inconsistent">Inconsistent / Flagged</option>
              </select>
            </div>

            {/* List of Markers */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8b949e]">
                  No geocoded evidence matching filter criteria.
                </div>
              ) : (
                filteredReports.map(report => {
                  const isSelected = selectedReport?.id === report.id;
                  const score = report.verification?.confidenceScore ?? report.overallConfidenceScore;

                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full p-3 rounded-xl text-left transition border flex items-start justify-between gap-3 ${
                        isSelected 
                          ? 'bg-[#161b22] border-[#00f2fe] shadow-md' 
                          : 'bg-[#07090e] hover:bg-[#161b22] border-[#21262d]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#6e7681] mb-1">
                          <MapPin className="w-3 h-3 text-[#00f2fe]" />
                          <span>{report.location.latitude.toFixed(3)}, {report.location.longitude.toFixed(3)}</span>
                        </div>
                        <div className="text-xs font-bold text-[#f0f6fc] truncate">
                          {report.title}
                        </div>
                        <div className="text-[11px] text-[#8b949e] truncate mt-0.5">
                          {report.location.address}
                        </div>
                      </div>

                      {score !== undefined && (
                        <span className="text-xs font-mono font-bold text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded border border-[#00f2fe]/20 shrink-0">
                          {score}%
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
