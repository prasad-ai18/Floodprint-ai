import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  FileImage, 
  RefreshCw, 
  CloudRain, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Share2, 
  Check, 
  FileCheck2, 
  Video, 
  Volume2, 
  Camera, 
  Printer 
} from 'lucide-react';
import { getReportById, updateReport } from '../services/reports';
import { 
  analyzeVisualEvidence, 
  analyzeVideoEvidence, 
  analyzeAudioEvidence, 
  verifyWeatherConditions, 
  synthesizeVerification 
} from '../services/api';
import { FloodReport, SignalStatus, MultimodalOutcome } from '../types';
import { EvidenceMap } from '../components/common/EvidenceMap';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<FloodReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningVerification, setRunningVerification] = useState<boolean>(false);
  const [showWhyThisScore, setShowWhyThisScore] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReportById(id);
      if (!data) {
        setError('Report not found in evidence database.');
      } else {
        setReport(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRunFullVerification = async () => {
    if (!report) return;
    setRunningVerification(true);
    setError(null);
    try {
      // 1. Image AI Analysis
      let aiResult = report.aiAnalysis;
      if (!aiResult && report.primaryImageUrl) {
        aiResult = await analyzeVisualEvidence({
          imageUrl: report.primaryImageUrl,
          location: report.location.address,
          timestamp: report.evidenceTimestamp,
        });
      }

      // 2. Video Analysis
      let videoResult = report.videoAnalysis;
      const videoItem = (report.evidenceItems || []).find(e => e.type === 'video' && e.frames && e.frames.length > 0);
      if (!videoResult && videoItem && videoItem.frames) {
        videoResult = await analyzeVideoEvidence({
          frames: videoItem.frames,
          durationSeconds: videoItem.metadata?.durationSeconds,
          location: report.location.address,
          timestamp: report.evidenceTimestamp,
        });
      }

      // 3. Audio Analysis
      let audioResult = report.audioAnalysis;
      const audioItem = (report.evidenceItems || []).find(e => e.type === 'audio' && e.content);
      if (!audioResult && audioItem && audioItem.content) {
        audioResult = await analyzeAudioEvidence({
          audioContent: audioItem.content,
          location: report.location.address,
          timestamp: report.evidenceTimestamp,
        });
      }

      // 4. Weather Cross-Check
      let weatherResult = report.weatherVerification;
      if (!weatherResult) {
        weatherResult = await verifyWeatherConditions({
          latitude: report.location.latitude,
          longitude: report.location.longitude,
          timestamp: report.evidenceTimestamp,
          address: report.location.address,
        });
      }

      const updatedInterim: FloodReport = {
        ...report,
        aiAnalysis: aiResult,
        videoAnalysis: videoResult,
        audioAnalysis: audioResult,
        weatherVerification: weatherResult,
      };

      // 5. Synthesize Multimodal
      const verificationResult = await synthesizeVerification(updatedInterim);

      const score = verificationResult.confidenceScore;
      const finalUpdated: FloodReport = {
        ...updatedInterim,
        verification: verificationResult,
        overallConfidenceScore: score,
        verificationOutcome: verificationResult.outcome,
        status: 'verified',
        updatedAt: new Date().toISOString(),
      };

      await updateReport(report.id, {
        aiAnalysis: aiResult,
        videoAnalysis: videoResult,
        audioAnalysis: audioResult,
        weatherVerification: weatherResult,
        verification: verificationResult,
        overallConfidenceScore: score,
        verificationOutcome: verificationResult.outcome,
        status: 'verified',
      });

      setReport(finalUpdated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to execute verification synthesis.';
      setError(msg);
    } finally {
      setRunningVerification(false);
    }
  };

  if (loading) {
    return <LoadingState stage="default" message="Retrieving forensic case dossier, telemetry, and proof chain..." />;
  }

  if (error && !report) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <ErrorState message={error || 'Report not found'} onRetry={fetchReport} />
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-mono text-[#00f2fe] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!report) return null;

  const verification = report.verification;
  const aiAnalysis = report.aiAnalysis;
  const videoAnalysis = report.videoAnalysis;
  const audioAnalysis = report.audioAnalysis;
  const floodEvidence = aiAnalysis?.floodEvidence;
  const weather = report.weatherVerification;

  const primaryItem = (report.evidenceItems || []).find(e => e.type === 'image' && e.metadata?.hasExif);
  const exif = primaryItem?.metadata;

  const getStatusBadgeClass = (status?: SignalStatus) => {
    switch (status) {
      case 'supportive':
        return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30';
      case 'partially_supportive':
        return 'bg-[#00f2fe]/10 text-[#00f2fe] border-[#00f2fe]/30';
      case 'neutral':
        return 'bg-[#161b22] text-[#8b949e] border-[#30363d]';
      case 'potentially_inconsistent':
        return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30';
      case 'insufficient_data':
      default:
        return 'bg-[#161b22]/60 text-[#6e7681] border-[#21262d]';
    }
  };

  const getOutcomeBadge = (outcome?: MultimodalOutcome | string) => {
    switch (outcome) {
      case 'verified':
        return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/40';
      case 'partially_verified':
        return 'bg-[#00f2fe]/10 text-[#00f2fe] border-[#00f2fe]/40';
      case 'insufficient_evidence':
        return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40';
      case 'inconsistent':
        return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/40';
      default:
        return 'bg-[#161b22] text-[#8b949e] border-[#30363d]';
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. TOP CASE COMMAND BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262d] pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <span className="text-xs font-mono text-[#6e7681]">
            DOSSIER: {report.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition"
            title="Print Forensic Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          <button
            onClick={handleRunFullVerification}
            disabled={runningVerification}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${runningVerification ? 'animate-spin' : ''}`} />
            <span>{runningVerification ? 'Verifying...' : 'Re-run Verification'}</span>
          </button>
        </div>
      </div>

      {/* 2. CASE SUMMARY BANNER */}
      <div className="p-6 rounded-2xl bg-[#0d1117] border border-[#21262d] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 flex items-center gap-1">
              <FileCheck2 className="w-3 h-3" />
              Certified Forensic Case Dossier
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase border ${getOutcomeBadge(verification?.outcome || report.status)}`}>
              {verification?.outcome ? verification.outcome.replace(/_/g, ' ') : report.status.replace(/_/g, ' ')}
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-black text-[#f0f6fc] tracking-tight">
            {report.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#8b949e]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#6e7681]" />
              <span>{report.location.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#6e7681]" />
              <span>Incident: {new Date(report.evidenceTimestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Prominent Confidence Widget */}
        {verification && (
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] text-center min-w-[180px] shrink-0 font-mono">
            <span className="text-[10px] uppercase text-[#6e7681] block">Floodprint Score</span>
            <div className="text-3xl font-black text-[#00f2fe] mt-0.5">
              {verification.confidenceScore}
              <span className="text-sm text-[#6e7681] ml-1">/ 100</span>
            </div>
            <span className="text-[11px] font-bold text-[#f0f6fc] uppercase block mt-1">
              {verification.confidenceLevel}
            </span>
          </div>
        )}
      </div>

      {/* 3. THREE-PANEL INVESTIGATION WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL 1: MEDIA VAULT & SENSORS (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5 text-[#00f2fe]" />
                Media Vault Asset
              </h3>
              <span className="text-[10px] font-mono text-[#6e7681]">
                {(report.evidenceItems || []).length || 1} Items Ingested
              </span>
            </div>

            {/* Primary Image Viewer */}
            <div className="relative rounded-xl overflow-hidden border border-[#30363d] bg-[#07090e]">
              <img
                src={report.primaryImageUrl}
                alt={report.title}
                className="w-full h-auto object-cover max-h-72"
              />
              <span className="absolute bottom-2 left-2 bg-[#0d1117]/90 px-2 py-0.5 rounded text-[10px] font-mono text-[#00f2fe] border border-[#30363d]">
                Primary Photo Evidence
              </span>
            </div>

            {/* Camera EXIF Sensor Card */}
            {exif && (
              <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] text-[#6e7681]">
                  <span className="flex items-center gap-1 text-[#f0f6fc] font-bold">
                    <Camera className="w-3 h-3 text-[#00f2fe]" />
                    EXIF Hardware Tags
                  </span>
                  <span className={exif.hasGps ? 'text-[#10b981]' : 'text-[#f59e0b]'}>
                    {exif.hasGps ? 'GPS Tags Intact' : 'No GPS Tags'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] text-[#8b949e]">
                  <div>Camera: <span className="text-[#f0f6fc]">{exif.cameraModel || 'Standard'}</span></div>
                  <div>Captured: <span className="text-[#00f2fe]">{exif.captureDate ? new Date(exif.captureDate).toLocaleTimeString() : 'N/A'}</span></div>
                </div>
              </div>
            )}

            {/* Video Dynamics Viewer */}
            {videoAnalysis && (
              <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#00f2fe]" />
                    Video Frame Analysis
                  </span>
                  <span className="text-[10px] font-mono text-[#00f2fe] bg-[#00f2fe]/10 px-1.5 py-0.5 rounded">
                    {videoAnalysis.framesAnalyzed} Frames &bull; {videoAnalysis.confidence}% Conf
                  </span>
                </div>
                <p className="text-[#8b949e] leading-relaxed text-[11px]">
                  {videoAnalysis.sceneEvolution}
                </p>
                <div className="text-[10px] font-mono text-[#10b981]">
                  Motion: {videoAnalysis.motionConsistency.replace(/_/g, ' ')}
                </div>
              </div>
            )}

            {/* Audio Voice Transcription */}
            {audioAnalysis && (
              <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#f43f5e]" />
                    Witness Voice Note
                  </span>
                  <span className="text-[10px] font-mono text-[#f43f5e] bg-[#f43f5e]/10 px-1.5 py-0.5 rounded">
                    {audioAnalysis.confidence}% Audio Match
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] text-[#8b949e] italic text-[11px] leading-relaxed">
                  &ldquo;{audioAnalysis.transcription}&rdquo;
                </div>
              </div>
            )}

          </div>
        </div>

        {/* PANEL 2: AI EVIDENCE INTELLIGENCE & AUDIT (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Gemini Vision & Findings */}
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00f2fe]" />
                Gemini Vision Analysis
              </h3>
              {aiAnalysis && (
                <span className="text-[10px] font-mono text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded border border-[#00f2fe]/30">
                  {aiAnalysis.overallVisualConfidence}% Confidence
                </span>
              )}
            </div>

            {aiAnalysis ? (
              <div className="space-y-3 text-xs">
                <p className="text-[#8b949e] leading-relaxed">
                  {aiAnalysis.visualSummary}
                </p>

                {floodEvidence && (
                  <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-[#6e7681]">INUNDATION LEVEL:</span>
                      <span className="font-bold text-[#00f2fe]">{floodEvidence.waterDepthEstimate}</span>
                    </div>
                    {floodEvidence.observations && (
                      <ul className="space-y-1 text-[#8b949e] text-[11px] pt-1">
                        {floodEvidence.observations.map((obs, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#00f2fe] font-bold">&bull;</span>
                            <span>{obs}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#6e7681]">
                Visual analysis in processing queue.
              </div>
            )}
          </div>

          {/* Temporal Clock Delta Check */}
          {verification?.timeCheck && (
            <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                <span className="text-[11px] font-bold text-[#f0f6fc] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00f2fe]" />
                  Temporal Clock Delta Check
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  verification.timeCheck.status === 'consistent'
                    ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                    : 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30'
                }`}>
                  {verification.timeCheck.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-[#8b949e] leading-relaxed pt-1">
                {verification.timeCheck.details}
              </p>
            </div>
          )}

          {/* Supporting & Contradicting Evidence */}
          {verification && (
            <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono border-b border-[#21262d] pb-2">
                Forensic Corroboration Audit
              </h3>

              {/* Supporting */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-[#10b981]">
                  Supporting Signals ({verification.supportingEvidence.length})
                </span>
                <ul className="space-y-1 text-[#8b949e] text-[11px]">
                  {verification.supportingEvidence.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#10b981] font-bold">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contradicting */}
              {verification.contradictingEvidence.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-[#21262d]">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#f43f5e]">
                    Contradicting Signals ({verification.contradictingEvidence.length})
                  </span>
                  <ul className="space-y-1 text-[#f43f5e] text-[11px]">
                    {verification.contradictingEvidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>

        {/* PANEL 3: CONTEXT INTELLIGENCE & GIS MAP (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Interactive GIS Map */}
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00f2fe]" />
                Spatial GIS
              </h3>
              <span className="text-[10px] font-mono text-[#00f2fe]">
                {report.location.locationSource || 'GPS'}
              </span>
            </div>

            <EvidenceMap
              latitude={report.location.latitude || 29.7604}
              longitude={report.location.longitude || -95.3698}
              address={report.location.address}
              locationSource={report.location.locationSource}
              height="200px"
            />

            <div className="text-[11px] font-mono text-[#8b949e] space-y-1">
              <div>LAT: <span className="text-[#f0f6fc]">{report.location.latitude.toFixed(6)}</span></div>
              <div>LON: <span className="text-[#f0f6fc]">{report.location.longitude.toFixed(6)}</span></div>
              <div className="truncate text-[10px] text-[#6e7681] pt-1">{report.location.address}</div>
            </div>
          </div>

          {/* Historical Radar Archive Context */}
          <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#00f2fe]" />
                Radar Context
              </h3>
              <span className="text-[10px] text-[#10b981]">Open-Meteo</span>
            </div>

            {weather && weather.weather ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-[#6e7681] text-[10px] block">PRECIP</span>
                    <span className="font-bold text-[#00f2fe]">{weather.weather.precipitation.toFixed(1)} mm/h</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#161b22] border border-[#30363d]">
                    <span className="text-[#6e7681] text-[10px] block">TEMP</span>
                    <span className="font-bold text-[#f59e0b]">{weather.weather.temperature.toFixed(1)}°C</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#8b949e] font-sans leading-relaxed pt-1">
                  {weather.explanation}
                </p>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-[#6e7681]">
                Radar lookup pending.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 4. WHY THIS SCORE? POINT TABLE */}
      {verification && (
        <div className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3">
          <button
            onClick={() => setShowWhyThisScore(!showWhyThisScore)}
            className="w-full flex items-center justify-between text-xs font-bold text-[#f0f6fc] font-mono"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00f2fe]" />
              Why this score? (Normalized Signal Weights &amp; Score Breakdown)
            </span>
            {showWhyThisScore ? <ChevronUp className="w-4 h-4 text-[#6e7681]" /> : <ChevronDown className="w-4 h-4 text-[#6e7681]" />}
          </button>

          {showWhyThisScore && (
            <div className="overflow-x-auto rounded-xl border border-[#21262d] bg-[#161b22] mt-3">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#21262d] text-[#6e7681] uppercase text-[10px]">
                    <th className="py-2.5 px-3.5">Forensic Dimension</th>
                    <th className="py-2.5 px-3.5">Status</th>
                    <th className="py-2.5 px-3.5">Normalized Weight</th>
                    <th className="py-2.5 px-3.5">Score</th>
                    <th className="py-2.5 px-3.5">Point Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d] text-[#8b949e]">
                  {Object.values(verification.signals).map((sig) => {
                    if (!sig) return null;
                    return (
                      <tr key={sig.signalKey}>
                        <td className="py-2 px-3.5 font-sans font-semibold text-[#f0f6fc]">{sig.name}</td>
                        <td className="py-2 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize border ${getStatusBadgeClass(sig.status)}`}>
                            {sig.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3.5 text-[#00f2fe] font-bold">{Math.round(sig.normalizedWeight * 100)}%</td>
                        <td className="py-2 px-3.5 text-[#f0f6fc]">{sig.score}/100</td>
                        <td className="py-2 px-3.5 text-[#10b981] font-bold">
                          {(sig.score * sig.normalizedWeight).toFixed(1)} pts
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-[#0d1117] font-bold text-[#f0f6fc] text-xs">
                    <td className="py-2.5 px-3.5 font-sans">TOTAL MULTIMODAL SYNTHESIS</td>
                    <td className="py-2.5 px-3.5 text-[#00f2fe]">&mdash;</td>
                    <td className="py-2.5 px-3.5 text-[#00f2fe]">100%</td>
                    <td className="py-2.5 px-3.5 text-[#6e7681]">&mdash;</td>
                    <td className="py-2.5 px-3.5 text-[#00f2fe] font-mono font-black text-sm">
                      {verification.confidenceScore} / 100
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
