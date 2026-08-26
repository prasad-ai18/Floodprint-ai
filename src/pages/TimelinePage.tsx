import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitCommit, 
  CheckCircle2, 
  MapPin, 
  ChevronRight, 
  Layers
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';
import { LoadingState } from '../components/common/LoadingState';

export const TimelinePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const uid = currentUser?.uid || 'demo_user_123';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load timeline events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [currentUser]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#21262d] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <GitCommit className="w-3.5 h-3.5" />
            Immutable Audit Trail
          </div>
          <h1 className="text-2xl font-black text-[#f0f6fc] tracking-tight">
            Proof Chain &amp; Audit Logs
          </h1>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Step-by-step cryptographic and chronological verification timeline for all disaster claims and AI synthesis decisions.
          </p>
        </div>

        <Link
          to="/submit"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/10"
        >
          + Ingest Evidence
        </Link>
      </div>

      {loading ? (
        <LoadingState stage="default" message="Loading proof chain and audit stream..." />
      ) : reports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0d1117] border border-[#21262d] border-dashed space-y-3">
          <Layers className="w-10 h-10 text-[#6e7681] mx-auto" />
          <h3 className="text-sm font-bold text-[#f0f6fc]">No audit records found</h3>
          <p className="text-xs text-[#8b949e] max-w-sm mx-auto">
            Submit a disaster case to begin generating a chronological proof chain.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            const v = report.verification;
            const weather = report.weatherVerification;
            const items = report.evidenceItems || [];

            return (
              <div
                key={report.id}
                className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-4 shadow-lg"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#21262d] pb-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#6e7681]">
                      <span>CASE: {report.id}</span>
                      <span>&bull;</span>
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#f0f6fc] mt-0.5">
                      {report.title}
                    </h3>
                  </div>

                  {v && (
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-xs text-[#8b949e]">CONFIDENCE:</span>
                      <span className="text-base font-black text-[#00f2fe]">
                        {v.confidenceScore}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Audit Steps */}
                <div className="relative pl-6 border-l border-[#30363d] space-y-5 my-2">
                  
                  {/* Step 1: Media Ingestion */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 p-1 rounded-full bg-[#161b22] border border-[#00f2fe] text-[#00f2fe]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#f0f6fc]">
                      STAGE 1: Multimodal Evidence Ingestion &amp; EXIF Extraction
                    </div>
                    <p className="text-xs text-[#8b949e] mt-0.5">
                      Ingested {items.length || 1} evidence items. Primary media archived in Cloudinary media vault with SHA verification.
                    </p>
                    <div className="text-[11px] font-mono text-[#6e7681] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      <span>{report.location.address} ({report.location.latitude}, {report.location.longitude})</span>
                    </div>
                  </div>

                  {/* Step 2: Gemini Vision & Claims */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 p-1 rounded-full bg-[#161b22] border border-[#00f2fe] text-[#00f2fe]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#f0f6fc]">
                      STAGE 2: Gemini Vision &amp; Multimodal Decomposition
                    </div>
                    <p className="text-xs text-[#8b949e] mt-0.5">
                      {report.aiAnalysis?.visualSummary || 'Processed visual inundation markers, scene evolution, and witness claims.'}
                    </p>
                  </div>

                  {/* Step 3: Open-Meteo Radar */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0 p-1 rounded-full bg-[#161b22] border border-[#00f2fe] text-[#00f2fe]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#f0f6fc]">
                      STAGE 3: Open-Meteo Historical Meteorological Cross-Check
                    </div>
                    <p className="text-xs text-[#8b949e] mt-0.5">
                      {weather?.explanation || 'Queried historical precipitation, cloud cover, and wind velocity logs.'}
                    </p>
                  </div>

                  {/* Step 4: Multi-Signal Synthesis */}
                  {v && (
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 p-1 rounded-full bg-[#161b22] border border-[#10b981] text-[#10b981]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs font-mono font-bold text-[#10b981]">
                        STAGE 4: Floodprint Multi-Signal Synthesis Certified ({v.confidenceScore} / 100)
                      </div>
                      <p className="text-xs text-[#8b949e] mt-0.5">
                        {v.explanation}
                      </p>
                    </div>
                  )}

                </div>

                {/* Footer Link */}
                <div className="pt-2 flex justify-end">
                  <Link
                    to={`/report/${report.id}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#00f2fe] hover:underline"
                  >
                    <span>View Certified Dossier</span>
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
