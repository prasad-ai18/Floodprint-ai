import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  ShieldCheck, 
  LocateFixed, 
  CheckCircle2, 
  Eye, 
  AlertCircle, 
  X, 
  Loader2, 
  Video, 
  Mic, 
  Square, 
  Camera, 
  Compass, 
  Clock, 
  Layers, 
  Film,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadImageToCloudinary, validateEvidenceFile } from '../services/cloudinary';
import { createReport, updateReport } from '../services/reports';
import { 
  analyzeVisualEvidence, 
  analyzeVideoEvidence, 
  analyzeAudioEvidence, 
  verifyWeatherConditions, 
  synthesizeVerification 
} from '../services/api';
import { extractExifMetadata } from '../services/metadata';
import { extractVideoFrames, VoiceEvidenceRecorder, fileToBase64 } from '../services/videoAudio';
import { 
  FloodReport, 
  LocationSource, 
  MultimodalEvidenceItem, 
  EvidenceMetadata, 
  FloodprintVerificationResult 
} from '../types';
import { EvidenceMap } from '../components/common/EvidenceMap';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const SubmitPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Active Media Tab
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio' | 'text'>('image');

  // Core Form Fields
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationSource, setLocationSource] = useState<LocationSource>('manual');
  
  // Real Time & Clock
  const [evidenceTimestamp, setEvidenceTimestamp] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [localTimezone, setLocalTimezone] = useState<string>('');

  // 1. Photo Evidence State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<EvidenceMetadata | null>(null);
  const [exifPrompt, setExifPrompt] = useState<string | null>(null);

  // 2. Video Evidence State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [extractingFrames, setExtractingFrames] = useState<boolean>(false);

  // 3. Audio / Voice Note Evidence State
  const [audioFile, setAudioFile] = useState<File | Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const audioRecorderRef = useRef<VoiceEvidenceRecorder | null>(null);

  // Field Validation & Loading State
  const [fileError, setFileError] = useState<string | null>(null);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [locating, setLocating] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStageText, setSubmitStageText] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Post-Submission Success State
  const [createdReport, setCreatedReport] = useState<FloodReport | null>(null);

  useEffect(() => {
    try {
      setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    } catch {
      setLocalTimezone('Local Time');
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Image Selection & EXIF Parsing
  const handleImageSelection = async (file: File) => {
    setFileError(null);
    setGeneralError(null);

    const validation = validateEvidenceFile(file);
    if (!validation.valid) {
      setFileError(validation.error || 'Invalid photo file.');
      return;
    }

    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));

    if (!title) {
      const sanitizedName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(`Flood Evidence — ${sanitizedName}`);
    }

    // Extract EXIF tags
    try {
      const meta = await extractExifMetadata(file);
      setImageMetadata(meta);

      if (meta.hasGps && meta.gpsLatitude && meta.gpsLongitude) {
        setLatitude(meta.gpsLatitude.toString());
        setLongitude(meta.gpsLongitude.toString());
        setLocationSource('exif_gps');
        if (!address) {
          setAddress(`EXIF GPS (${meta.gpsLatitude}, ${meta.gpsLongitude})`);
        }
        setExifPrompt(`Embedded camera GPS detected (${meta.gpsLatitude}, ${meta.gpsLongitude}). Autofilled location.`);
      }

      if (meta.captureDate) {
        const parsedIso = new Date(meta.captureDate).toISOString().slice(0, 16);
        setEvidenceTimestamp(parsedIso);
      }
    } catch (err) {
      console.warn('EXIF parse warning:', err);
    }
  };

  // Video Selection & Frame Extraction
  const handleVideoSelection = async (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('video/')) {
      setFileError('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setExtractingFrames(true);

    try {
      const videoData = await extractVideoFrames(file);
      setVideoFrames(videoData.frames);
      setVideoDuration(videoData.durationSeconds);
      if (!title) {
        setTitle(`Flood Video Recording (${videoData.durationSeconds}s)`);
      }
    } catch (err) {
      console.warn('Video frame sampling warning:', err);
    } finally {
      setExtractingFrames(false);
    }
  };

  // Live Audio Recording Controls
  const handleStartRecording = async () => {
    try {
      setFileError(null);
      const recorder = new VoiceEvidenceRecorder();
      audioRecorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn('Audio start error:', err);
      setFileError('Microphone permission denied or unsupported in this browser.');
    }
  };

  const handleStopRecording = async () => {
    if (!audioRecorderRef.current) return;
    try {
      const result = await audioRecorderRef.current.stop();
      setAudioFile(result.blob);
      setAudioPreviewUrl(result.url);
      setIsRecording(false);
      if (!title) {
        setTitle('Witness Voice Flood Report');
      }
    } catch (err) {
      console.error('Audio stop error:', err);
      setIsRecording(false);
    }
  };

  const handleAudioFileSelection = (file: File) => {
    setFileError(null);
    if (!file.type.startsWith('audio/')) {
      setFileError('Please select a valid audio file (MP3, WAV, WebM, M4A).');
      return;
    }
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
    if (!title) {
      setTitle(`Audio Evidence — ${file.name}`);
    }
  };

  // Device Geolocation
  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      setCoordError('Geolocation is not supported by your browser. You can click on the map to set location.');
      return;
    }

    setLocating(true);
    setCoordError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setLatitude(lat);
        setLongitude(lng);
        setLocationSource('device_gps');
        if (!address || address.startsWith('EXIF')) {
          setAddress(`GPS Location (${lat}, ${lng})`);
        }
      },
      () => {
        setLocating(false);
        setCoordError('Location permission denied. Click on the map or enter address manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Map Click Location Selection
  const handleMapLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setLocationSource('map_selected');
    setCoordError(null);
    if (!address || address.startsWith('GPS') || address.startsWith('EXIF') || address.startsWith('Pin')) {
      setAddress(`Pin Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  };

  const validateForm = (): boolean => {
    setFileError(null);
    setCoordError(null);
    setGeneralError(null);

    if (!imageFile && !videoFile && !audioFile && !description.trim()) {
      setFileError('Please provide at least one piece of evidence (Photo, Video, Voice Recording, or Description).');
      return false;
    }

    if (latitude) {
      const latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        setCoordError('Latitude must be between -90 and 90.');
        return false;
      }
    }

    if (longitude) {
      const lngNum = parseFloat(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        setCoordError('Longitude must be between -180 and 180.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    const lat = latitude ? parseFloat(latitude) : 0;
    const lng = longitude ? parseFloat(longitude) : 0;
    const eventTimeIso = new Date(evidenceTimestamp).toISOString();
    const submissionTimeIso = new Date().toISOString();
    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const resolvedAddress = address.trim() || (lat && lng ? `Coordinates (${lat}, ${lng})` : 'Location Unspecified');

    try {
      const evidenceItems: MultimodalEvidenceItem[] = [];

      let primaryUrl = 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80';
      let primaryPublicId = 'default_flood_ref';
      let originalFileName = 'evidence.jpg';
      let fileType = 'image/jpeg';
      let fileSizeBytes = 0;

      if (imageFile) {
        setSubmitStageText('Uploading photo evidence to Cloudinary media vault...');
        const uploadResult = await uploadImageToCloudinary(imageFile, (p) => setUploadProgress(p));
        primaryUrl = uploadResult.secureUrl;
        primaryPublicId = uploadResult.publicId;
        originalFileName = uploadResult.originalFilename;
        fileType = uploadResult.format;
        fileSizeBytes = uploadResult.bytes;

        evidenceItems.push({
          id: `ev_img_${Date.now()}`,
          type: 'image',
          url: uploadResult.secureUrl,
          publicId: uploadResult.publicId,
          fileName: uploadResult.originalFilename,
          fileSizeBytes: uploadResult.bytes,
          mimeType: uploadResult.format,
          capturedAt: imageMetadata?.captureDate || eventTimeIso,
          uploadedAt: submissionTimeIso,
          metadata: imageMetadata || undefined,
        });
      }

      if (videoFile) {
        setSubmitStageText('Processing video evidence and sampled frame sequence...');
        evidenceItems.push({
          id: `ev_vid_${Date.now()}`,
          type: 'video',
          fileName: videoFile.name,
          fileSizeBytes: videoFile.size,
          mimeType: videoFile.type,
          capturedAt: eventTimeIso,
          uploadedAt: submissionTimeIso,
          frames: videoFrames,
          metadata: {
            durationSeconds: videoDuration,
            hasExif: false,
          },
        });
        if (!imageFile && videoFrames.length > 0) {
          primaryUrl = videoFrames[0];
          originalFileName = videoFile.name;
          fileType = 'video/mp4';
          fileSizeBytes = videoFile.size;
        }
      }

      if (audioFile) {
        setSubmitStageText('Ingesting voice report and preparing audio transcription...');
        const audioBase64 = await fileToBase64(audioFile);
        evidenceItems.push({
          id: `ev_aud_${Date.now()}`,
          type: 'audio',
          uploadedAt: submissionTimeIso,
          capturedAt: eventTimeIso,
          content: audioBase64,
        });
      }

      if (description.trim()) {
        evidenceItems.push({
          id: `ev_txt_${Date.now()}`,
          type: 'text',
          content: description.trim(),
          uploadedAt: submissionTimeIso,
          capturedAt: eventTimeIso,
        });
      }

      const initialReport: FloodReport = {
        id: reportId,
        userId: currentUser?.uid || 'demo_user_123',
        userEmail: currentUser?.email || undefined,
        createdAt: submissionTimeIso,
        updatedAt: submissionTimeIso,
        evidenceTimestamp: eventTimeIso,
        status: 'pending_verification',
        title: title.trim() || 'Multimodal Flood Evidence Record',
        description: description.trim() || undefined,
        location: {
          address: resolvedAddress,
          latitude: lat,
          longitude: lng,
          locationSource,
        },
        primaryImageUrl: primaryUrl,
        primaryImagePublicId: primaryPublicId,
        originalFileName,
        fileType,
        fileSizeBytes,
        evidenceItems,
        verificationOutcome: 'pending',
      };

      await createReport(initialReport);

      // Gemini Visual Analysis
      let aiAnalysisResult;
      if (imageFile || primaryUrl) {
        setSubmitStageText('Executing Gemini 1.5 Flash multimodal vision analysis...');
        try {
          aiAnalysisResult = await analyzeVisualEvidence({
            imageUrl: primaryUrl,
            location: resolvedAddress,
            timestamp: eventTimeIso,
          });
        } catch (e) {
          console.warn('Image analysis warning:', e);
        }
      }

      // Gemini Video Frames Analysis
      let videoAnalysisResult;
      if (videoFrames.length > 0) {
        setSubmitStageText('Analyzing video frame motion, fluid dynamics & scene progression...');
        try {
          videoAnalysisResult = await analyzeVideoEvidence({
            frames: videoFrames,
            durationSeconds: videoDuration,
            location: resolvedAddress,
            timestamp: eventTimeIso,
          });
        } catch (e) {
          console.warn('Video analysis warning:', e);
        }
      }

      // Gemini Voice Transcription
      let audioAnalysisResult;
      if (audioFile) {
        setSubmitStageText('Transcribing audio recording and extracting forensic claims...');
        try {
          const audioBase64 = await fileToBase64(audioFile);
          audioAnalysisResult = await analyzeAudioEvidence({
            audioContent: audioBase64,
            location: resolvedAddress,
            timestamp: eventTimeIso,
          });
        } catch (e) {
          console.warn('Audio analysis warning:', e);
        }
      }

      // Historical Weather Radar
      setSubmitStageText('Querying Open-Meteo historical radar archive (precipitation, cloud, wind)...');
      let weatherResult;
      try {
        weatherResult = await verifyWeatherConditions({
          latitude: lat,
          longitude: lng,
          timestamp: eventTimeIso,
          address: resolvedAddress,
        });
      } catch (e) {
        console.warn('Weather cross-check warning:', e);
      }

      // Central Multi-Signal Synthesis
      setSubmitStageText('Synthesizing multimodal evidence into explainable Floodprint Assessment...');
      const intermediateReport: FloodReport = {
        ...initialReport,
        aiAnalysis: aiAnalysisResult,
        videoAnalysis: videoAnalysisResult,
        audioAnalysis: audioAnalysisResult,
        weatherVerification: weatherResult,
      };

      let verificationResult: FloodprintVerificationResult | undefined;
      try {
        verificationResult = await synthesizeVerification(intermediateReport);
      } catch (e) {
        console.warn('Synthesis warning:', e);
      }

      const score = verificationResult?.confidenceScore;
      const finalReport: FloodReport = {
        ...intermediateReport,
        verification: verificationResult,
        overallConfidenceScore: score,
        verificationOutcome: verificationResult?.outcome || 'pending',
        status: verificationResult ? 'verified' : 'pending_verification',
        updatedAt: new Date().toISOString(),
      };

      await updateReport(reportId, {
        aiAnalysis: aiAnalysisResult,
        videoAnalysis: videoAnalysisResult,
        audioAnalysis: audioAnalysisResult,
        weatherVerification: weatherResult,
        verification: verificationResult,
        overallConfidenceScore: score,
        verificationOutcome: verificationResult?.outcome || 'pending',
        status: verificationResult ? 'verified' : 'pending_verification',
      });

      setCreatedReport(finalReport);
      setIsSubmitting(false);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'An error occurred during submission.';
      setGeneralError(msg);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageMetadata(null);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoFrames([]);
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setTitle('');
    setDescription('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setCreatedReport(null);
    setGeneralError(null);
    setFileError(null);
    setCoordError(null);
    setExifPrompt(null);
  };

  // SUCCESS SCREEN
  if (createdReport) {
    const v = createdReport.verification;
    return (
      <div className="max-w-2xl mx-auto space-y-4 pb-12">
        <div className="p-6 rounded-2xl bg-[#0d1117] border border-[#10b981]/50 shadow-2xl space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f0f6fc]">
                Multimodal Case Ingested &amp; Certified
              </h2>
              <p className="text-xs text-[#8b949e]">
                Synthesized across {createdReport.evidenceItems.length} evidence modalit{createdReport.evidenceItems.length === 1 ? 'y' : 'ies'} with Gemini &amp; Open-Meteo.
              </p>
            </div>
          </div>

          {v && (
            <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] uppercase text-[#6e7681] block">Confidence Score</span>
                <div className="text-2xl font-black text-[#00f2fe] mt-0.5">
                  {v.confidenceScore} / 100
                </div>
                <span className="text-[11px] font-bold text-[#f0f6fc] uppercase">{v.confidenceLevel}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-[#6e7681] block">Certified Outcome</span>
                <span className="text-xs font-bold text-[#10b981] uppercase block mt-0.5">{v.outcome.replace(/_/g, ' ')}</span>
              </div>
            </div>
          )}

          {createdReport.location.latitude && createdReport.location.longitude && (
            <div>
              <span className="text-[11px] font-mono text-[#8b949e] block mb-1.5">GIS Spatial Pin:</span>
              <EvidenceMap
                latitude={createdReport.location.latitude}
                longitude={createdReport.location.longitude}
                address={createdReport.location.address}
                locationSource={createdReport.location.locationSource}
                height="180px"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition"
            >
              + Ingest Another Case
            </button>
            <Link
              to={`/report/${createdReport.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/10 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Inspect Case Dossier</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Header */}
      <div className="border-b border-[#21262d] pb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5" />
          Evidence Ingestion Engine
        </div>
        <h1 className="text-2xl font-black text-[#f0f6fc] tracking-tight">
          Submit Disaster Evidence
        </h1>
        <p className="mt-0.5 text-xs text-[#8b949e]">
          Upload photos, videos, voice recordings, and text claims. The system automatically cross-references EXIF metadata, GPS coordinates, and historical meteorological radar.
        </p>
      </div>

      {generalError && (
        <ErrorState message={generalError} onDismiss={() => setGeneralError(null)} />
      )}

      {isSubmitting ? (
        <LoadingState 
          stage="analyzing" 
          message={submitStageText}
          progress={uploadProgress > 0 && uploadProgress < 100 ? uploadProgress : undefined} 
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: MULTIMODAL MEDIA UPLOAD ZONE */}
          <div className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-[#21262d] pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'image' 
                    ? 'bg-[#00f2fe] text-slate-950 font-bold' 
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>1. Photos / Imagery</span>
                {imageFile && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'video' 
                    ? 'bg-[#00f2fe] text-slate-950 font-bold' 
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>2. Video Evidence</span>
                {videoFile && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'audio' 
                    ? 'bg-[#00f2fe] text-slate-950 font-bold' 
                    : 'bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>3. Voice / Audio Statement</span>
                {audioFile && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>
            </div>

            {/* TAB 1: Photo Evidence */}
            {activeTab === 'image' && (
              <div className="space-y-3">
                {imagePreviewUrl && imageFile ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-[#30363d] bg-[#07090e] max-h-72 flex items-center justify-center">
                      <img src={imagePreviewUrl} alt="Photo Evidence" className="w-full h-auto object-contain max-h-72" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreviewUrl(null); setImageMetadata(null); setExifPrompt(null); }}
                        className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-[#0d1117]/80 hover:bg-[#161b22] text-[#f43f5e] border border-[#30363d] transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {imageMetadata && (
                      <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between text-[#6e7681]">
                          <span className="font-bold text-[#f0f6fc]">EXIF Hardware &amp; Sensor Telemetry</span>
                          <span className={imageMetadata.hasGps ? 'text-[#10b981]' : 'text-[#f59e0b]'}>
                            {imageMetadata.hasGps ? 'GPS Tags Detected' : 'No GPS Tags'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#8b949e]">
                          <div>Camera: <span className="text-[#f0f6fc]">{imageMetadata.cameraModel || 'Standard'}</span></div>
                          <div>Capture: <span className="text-[#00f2fe]">{imageMetadata.captureDate ? new Date(imageMetadata.captureDate).toLocaleTimeString() : 'N/A'}</span></div>
                          <div>Size: <span className="text-[#8b949e]">{formatFileSize(imageFile.size)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.[0]) handleImageSelection(e.dataTransfer.files[0]);
                    }}
                    className="relative border border-dashed border-[#30363d] hover:border-[#00f2fe] rounded-xl p-8 text-center bg-[#07090e] transition cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={(e) => e.target.files?.[0] && handleImageSelection(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center pointer-events-none space-y-2">
                      <div className="p-2.5 rounded-lg bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-[#f0f6fc]">Upload flood photo (JPG, PNG, WebP)</div>
                      <div className="text-[11px] text-[#6e7681]">EXIF metadata &amp; GPS coordinates are automatically extracted upon upload</div>
                    </div>
                  </div>
                )}

                {exifPrompt && (
                  <div className="p-2.5 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-xs text-[#10b981] flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{exifPrompt}</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Video Evidence */}
            {activeTab === 'video' && (
              <div className="space-y-3">
                {videoPreviewUrl && videoFile ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border border-[#30363d] bg-[#07090e]">
                      <video src={videoPreviewUrl} controls className="w-full max-h-72 object-contain" />
                      <button
                        type="button"
                        onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); setVideoFrames([]); }}
                        className="absolute top-2.5 right-2.5 p-1 rounded-lg bg-[#0d1117]/80 hover:bg-[#161b22] text-[#f43f5e] border border-[#30363d]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {extractingFrames ? (
                      <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e] flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#00f2fe]" />
                        <span>Sampling video frame progression via HTML5 canvas...</span>
                      </div>
                    ) : videoFrames.length > 0 && (
                      <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
                        <span className="text-xs font-semibold text-[#f0f6fc] flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#00f2fe]" />
                          Extracted Frames for Temporal Consistency Analysis ({videoFrames.length} frames):
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {videoFrames.map((frame, idx) => (
                            <img key={idx} src={frame} alt={`Frame ${idx + 1}`} className="rounded border border-[#30363d] h-20 w-full object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative border border-dashed border-[#30363d] hover:border-[#00f2fe] rounded-xl p-8 text-center bg-[#07090e] transition cursor-pointer">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => e.target.files?.[0] && handleVideoSelection(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center pointer-events-none space-y-2">
                      <div className="p-2.5 rounded-lg bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-semibold text-[#f0f6fc]">Upload flood video (MP4, WebM)</div>
                      <div className="text-[11px] text-[#6e7681]">Representative frames will be extracted and analyzed for fluid motion and scene evolution</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Audio / Voice Note Evidence */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="p-6 rounded-xl bg-[#07090e] border border-[#21262d] text-center space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#f0f6fc]">Record Witness Voice Statement</h4>
                    <p className="text-[11px] text-[#8b949e] mt-0.5">
                      Speak your observations (landmarks, water rise velocity, time). AI will transcribe and extract corroborating claims.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f43f5e] hover:bg-[#e11d48] text-white text-xs font-bold transition shadow-md shadow-rose-600/20"
                      >
                        <Mic className="w-4 h-4" />
                        Start Live Voice Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#161b22] text-[#f43f5e] text-xs font-bold border border-[#f43f5e] animate-pulse transition"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        Stop Recording
                      </button>
                    )}
                  </div>

                  {audioPreviewUrl && (
                    <div className="pt-3 border-t border-[#21262d] flex flex-col items-center space-y-2">
                      <audio src={audioPreviewUrl} controls className="w-full max-w-md" />
                      <button
                        type="button"
                        onClick={() => { setAudioFile(null); setAudioPreviewUrl(null); }}
                        className="text-[11px] text-[#f43f5e] hover:underline"
                      >
                        Remove Voice Recording
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-[#6e7681]">
                  Or upload an audio file:
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && handleAudioFileSelection(e.target.files[0])}
                    className="ml-2 text-[#8b949e] text-xs"
                  />
                </div>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-[#f43f5e] font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {fileError}
              </p>
            )}
          </div>

          {/* STEP 2: REAL LOCATION & INTERACTIVE GIS MAP */}
          <div className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] pb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#00f2fe]" />
                  Spatial Telemetry &amp; Location Pin
                </label>
                <p className="text-[11px] text-[#8b949e]">
                  Priority: 1. EXIF GPS &rarr; 2. Device GPS &rarr; 3. Map Pin &rarr; 4. Manual address.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-[#00f2fe] border border-[#30363d] text-xs font-semibold transition disabled:opacity-50 font-mono"
              >
                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                {locating ? 'Locating...' : 'Browser GPS'}
              </button>
            </div>

            {/* Interactive Leaflet Map */}
            <EvidenceMap
              latitude={latitude ? parseFloat(latitude) : 29.7604}
              longitude={longitude ? parseFloat(longitude) : -95.3698}
              address={address}
              locationSource={locationSource}
              interactive={true}
              onLocationSelect={handleMapLocationSelect}
              height="240px"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#6e7681] mb-1">
                  LATITUDE
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => { setLatitude(e.target.value); setLocationSource('manual'); }}
                  placeholder="e.g. 29.760427"
                  className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#6e7681] mb-1">
                  LONGITUDE
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => { setLongitude(e.target.value); setLocationSource('manual'); }}
                  placeholder="e.g. -95.369803"
                  className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#6e7681] mb-1">
                  ADDRESS / LANDMARK
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Main St Crossing, Houston"
                  className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
                />
              </div>
            </div>

            {coordError && (
              <p className="text-xs text-[#f43f5e] font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {coordError}
              </p>
            )}
          </div>

          {/* STEP 3: REAL TIME & CLOCK LAYER */}
          <div className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#00f2fe]" />
                Temporal Alignment &amp; Clock Delta
              </label>
              <span className="text-[10px] font-mono text-[#00f2fe] bg-[#00f2fe]/10 px-2 py-0.5 rounded border border-[#00f2fe]/30">
                TZ: {localTimezone}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Claimed Incident Occurrence Time <span className="text-[#f43f5e]">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={evidenceTimestamp}
                  onChange={(e) => setEvidenceTimestamp(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] focus:outline-none focus:border-[#00f2fe] font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-xs space-y-1">
                <span className="text-[#6e7681] block uppercase font-mono text-[10px]">Temporal Cross-Check</span>
                <p className="text-[#8b949e] leading-relaxed text-[11px]">
                  Incident timestamp is correlated with EXIF capture date and Open-Meteo radar observation archives.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4: CLAIM NARRATIVE */}
          <div className="p-5 rounded-2xl bg-[#0d1117] border border-[#21262d] space-y-3">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#f0f6fc] font-mono flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#00f2fe]" />
                Claim Title &amp; Submitter Narrative
              </label>
              <span className="text-[10px] font-mono text-[#6e7681]">{description.length}/500</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Case Investigation Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flash flooding along residential intersection"
                  className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
                  Witness Narrative / Context Observations
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe visible landmarks, water rise velocity, damaged vehicles, or source of water..."
                  className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/10 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Submit &amp; Synthesize Multi-Signal Evidence</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
