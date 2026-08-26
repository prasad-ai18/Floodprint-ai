import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Video, 
  Mic, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Compass, 
  ShieldCheck, 
  LocateFixed, 
  Film, 
  Square, 
  UploadCloud,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { EvidenceMap } from '../components/common/EvidenceMap';
import { LocationSource, FloodReport, MultimodalEvidenceItem } from '../types';
import { extractImageExif, extractVideoFrames, formatFileSize } from '../utils/media';
import { analyzeVisualEvidence, verifyWeatherConditions, synthesizeVerification, extractDocumentIntelligence } from '../services/api';
import { createReport } from '../services/reports';

export const SubmitPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Active Multimodal Media Tab
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio' | 'text'>('image');

  // Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('13.2172');
  const [longitude, setLongitude] = useState<string>('79.1003');
  const [address, setAddress] = useState<string>('Chittoor, Andhra Pradesh, India');
  const [locationSource, setLocationSource] = useState<LocationSource>('manual');
  const [evidenceTimestamp, setEvidenceTimestamp] = useState<string>('');

  // Media Files
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<any>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [extractingFrames, setExtractingFrames] = useState<boolean>(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Telemetry & State
  const [locating, setLocating] = useState<boolean>(false);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [localTimezone, setLocalTimezone] = useState<string>('IST');
  const [exifPrompt, setExifPrompt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      setLocalTimezone(tz.includes('Kolkata') || tz.includes('Calcutta') ? 'IST' : tz);
    } catch {
      setLocalTimezone('IST');
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const localIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setEvidenceTimestamp(localIso);
  }, []);

  // Image Selection Handler
  const handleImageSelection = async (file: File) => {
    setFileError(null);
    setExifPrompt(null);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));

    try {
      const meta = await extractImageExif(file);
      setImageMetadata(meta);

      if (meta.hasGps && meta.latitude && meta.longitude) {
        setLatitude(meta.latitude.toFixed(6));
        setLongitude(meta.longitude.toFixed(6));
        setLocationSource('exif_gps');
        setExifPrompt(`Auto-locked coordinates from camera sensor: ${meta.latitude.toFixed(4)}, ${meta.longitude.toFixed(4)}`);
      }

      if (meta.captureDate) {
        const d = new Date(meta.captureDate);
        if (!isNaN(d.getTime())) {
          const pad = (n: number) => n.toString().padStart(2, '0');
          setEvidenceTimestamp(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        }
      }
    } catch (err) {
      console.warn('EXIF parse notice:', err);
    }
  };

  // Video Selection Handler
  const handleVideoSelection = async (file: File) => {
    setFileError(null);
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setExtractingFrames(true);

    try {
      const frames = await extractVideoFrames(file, 3);
      setVideoFrames(frames);
    } catch (err) {
      console.warn('Video frame sampling notice:', err);
    } finally {
      setExtractingFrames(false);
    }
  };

  // Audio / Voice Handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], `voice_statement_${Date.now()}.webm`, { type: 'audio/webm' });
        setAudioFile(file);
        setAudioPreviewUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setFileError('Microphone access unavailable or denied.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioFileSelection = (file: File) => {
    setFileError(null);
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  // Browser Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setCoordError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setCoordError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocationSource('device_gps');
        setLocating(false);
      },
      (err) => {
        setCoordError(`GPS unavailable: ${err.message}. Using Chittoor, AP defaults.`);
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit & Synthesize Pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!imageFile && !videoFile && !audioFile && !description.trim()) {
      setFileError('Please provide at least one evidence item (photo, video, voice note, or incident notes).');
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setCoordError('Please provide valid latitude and longitude coordinates.');
      return;
    }

    setIsSubmitting(true);

    try {
      setSubmissionStep('1/5: Ingesting evidence files & sensor metadata...');
      
      let imageUrl = imagePreviewUrl || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80';
      if (imageFile) {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      setSubmissionStep('2/5: Executing Gemini Multimodal Visual & Text Extraction...');
      const [aiVisual] = await Promise.all([
        analyzeVisualEvidence({
          imageUrl,
          location: address,
          timestamp: evidenceTimestamp,
        }),
        description ? extractDocumentIntelligence({ rawContent: description, metadata: { fileName: title || 'Field Note' } }) : null
      ]);

      setSubmissionStep('3/5: Cross-referencing Open-Meteo Historical Meteorological Archives...');
      const weatherResult = await verifyWeatherConditions({
        latitude: latNum,
        longitude: lngNum,
        timestamp: evidenceTimestamp,
        address,
      });

      const evidenceItems: MultimodalEvidenceItem[] = [
        ...(imageFile ? [{ id: 'ev_img', type: 'image' as const, url: imageUrl, mimeType: imageFile.type, uploadedAt: new Date().toISOString() }] : []),
        ...(videoFile ? [{ id: 'ev_vid', type: 'video' as const, url: videoPreviewUrl || '', mimeType: videoFile.type, uploadedAt: new Date().toISOString() }] : []),
        ...(audioFile ? [{ id: 'ev_aud', type: 'audio' as const, url: audioPreviewUrl || '', mimeType: audioFile.type, uploadedAt: new Date().toISOString() }] : []),
        ...(description ? [{ id: 'ev_doc', type: 'text' as const, content: description, uploadedAt: new Date().toISOString() }] : []),
      ];

      const provisionalReport: FloodReport = {
        id: `flood_${Date.now()}`,
        userId: currentUser?.uid || 'user',
        title: title.trim() || `Flood Assessment: ${address.split(',')[0]}`,
        description: description.trim() || aiVisual.visualSummary,
        location: {
          latitude: latNum,
          longitude: lngNum,
          address,
          locationSource,
        },
        evidenceTimestamp: new Date(evidenceTimestamp).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'submitted',
        primaryImageUrl: imageUrl,
        evidenceItems,
        aiAnalysis: aiVisual,
        weatherVerification: weatherResult,
      };

      setSubmissionStep('4/5: Synthesizing multi-signal cross-corroboration...');
      const synthesis = await synthesizeVerification(provisionalReport);
      provisionalReport.verification = synthesis;
      provisionalReport.overallConfidenceScore = synthesis.confidenceScore;
      provisionalReport.verificationOutcome = synthesis.confidenceLevel === 'high_confidence_verified' ? 'verified' : 'review_recommended';

      setSubmissionStep('5/5: Registering dossier into evidence vault...');
      await createReport(provisionalReport);

      navigate(`/report/${provisionalReport.id}`);
    } catch (err: any) {
      console.error('Submission pipeline error:', err);
      setFileError(err.message || 'Evidence verification pipeline encountered an error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* Header */}
      <div className="border-b border-[#e2e8f0] pb-4">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0284c7]/10 border border-[#0284c7]/20 text-[#0284c7] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
          <span>📤</span>
          <span>Upload Evidence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
          📤 Upload Evidence
        </h1>
        <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
          Transform raw environmental evidence into understandable intelligence.
        </p>
      </div>

      {isSubmitting ? (
        <div className="p-12 rounded-3xl bg-white border border-[#e2e8f0] text-center space-y-4 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-[#0284c7] mx-auto" />
          <h3 className="text-base font-bold text-[#0f172a]">Synthesizing Multimodal Evidence</h3>
          <p className="text-xs text-[#64748b] font-mono">{submissionStep}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: MULTIMODAL MEDIA UPLOAD ZONE */}
          <div className="p-6 rounded-3xl bg-white border border-[#e2e8f0] space-y-4 shadow-sm">
            
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'image' 
                    ? 'bg-[#0284c7] text-white shadow-xs' 
                    : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1]'
                }`}
              >
                <span>🖼️</span>
                <Camera className="w-3.5 h-3.5" />
                <span>Photos / Imagery</span>
                {imageFile && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'video' 
                    ? 'bg-[#0284c7] text-white shadow-xs' 
                    : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1]'
                }`}
              >
                <span>🎥</span>
                <Video className="w-3.5 h-3.5" />
                <span>Video Evidence</span>
                {videoFile && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'audio' 
                    ? 'bg-[#0284c7] text-white shadow-xs' 
                    : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1]'
                }`}
              >
                <span>🎙️</span>
                <Mic className="w-3.5 h-3.5" />
                <span>Voice / Audio Statement</span>
                {audioFile && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'text' 
                    ? 'bg-[#0284c7] text-white shadow-xs' 
                    : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1]'
                }`}
              >
                <span>📄</span>
                <FileText className="w-3.5 h-3.5" />
                <span>Documents &amp; Field Notes</span>
                {description && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
              </button>
            </div>

            {/* TAB 1: Photo Evidence */}
            {activeTab === 'image' && (
              <div className="space-y-3">
                {imagePreviewUrl && imageFile ? (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border border-[#cbd5e1] bg-[#f8fafc] max-h-72 flex items-center justify-center">
                      <img src={imagePreviewUrl} alt="Photo Evidence" className="w-full h-auto object-contain max-h-72" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreviewUrl(null); setImageMetadata(null); setExifPrompt(null); }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-white/90 hover:bg-white text-[#e11d48] border border-[#cbd5e1] shadow-sm transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {imageMetadata && (
                      <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-1 font-mono">
                        <div className="flex items-center justify-between text-[#64748b]">
                          <span className="font-bold text-[#0f172a]">EXIF Hardware &amp; Sensor Telemetry</span>
                          <span className={imageMetadata.hasGps ? 'text-[#10b981] font-bold' : 'text-[#d97706]'}>
                            {imageMetadata.hasGps ? 'GPS Tags Detected' : 'No GPS Tags'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[#64748b]">
                          <div>Camera: <span className="text-[#0f172a] font-semibold">{imageMetadata.cameraModel || 'Standard'}</span></div>
                          <div>Capture: <span className="text-[#0284c7] font-semibold">{imageMetadata.captureDate ? new Date(imageMetadata.captureDate).toLocaleTimeString() : 'N/A'}</span></div>
                          <div>Size: <span className="text-[#64748b]">{formatFileSize(imageFile.size)}</span></div>
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
                    className="relative border-2 border-dashed border-[#cbd5e1] hover:border-[#0284c7] rounded-2xl p-10 text-center bg-[#f8fafc] hover:bg-[#f0f9ff] transition cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      onChange={(e) => e.target.files?.[0] && handleImageSelection(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center pointer-events-none space-y-2">
                      <div className="p-3 rounded-2xl bg-white text-[#0284c7] border border-[#e2e8f0] shadow-sm">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-[#0f172a]">Drop flood imagery here or Browse Files</div>
                      <div className="text-[11px] text-[#64748b]">EXIF metadata &amp; GPS coordinates are automatically extracted upon upload</div>
                    </div>
                  </div>
                )}

                {exifPrompt && (
                  <div className="p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#059669] flex items-center gap-2 font-mono font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
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
                    <div className="relative rounded-2xl overflow-hidden border border-[#cbd5e1] bg-[#f8fafc]">
                      <video src={videoPreviewUrl} controls className="w-full max-h-72 object-contain" />
                      <button
                        type="button"
                        onClick={() => { setVideoFile(null); setVideoPreviewUrl(null); setVideoFrames([]); }}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-white/90 text-[#e11d48] border border-[#cbd5e1] shadow-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {extractingFrames ? (
                      <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b] flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
                        <span>Sampling video frame progression via HTML5 canvas...</span>
                      </div>
                    ) : videoFrames.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                        <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-[#0284c7]" />
                          Extracted Frames for Temporal Consistency Analysis ({videoFrames.length} frames):
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {videoFrames.map((frame, idx) => (
                            <img key={idx} src={frame} alt={`Frame ${idx + 1}`} className="rounded-lg border border-[#cbd5e1] h-20 w-full object-cover" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-[#cbd5e1] hover:border-[#0284c7] rounded-2xl p-10 text-center bg-[#f8fafc] hover:bg-[#f0f9ff] transition cursor-pointer">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      onChange={(e) => e.target.files?.[0] && handleVideoSelection(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center pointer-events-none space-y-2">
                      <div className="p-3 rounded-2xl bg-white text-[#0284c7] border border-[#e2e8f0] shadow-sm">
                        <Video className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-[#0f172a]">Drop flood video here or Browse Files</div>
                      <div className="text-[11px] text-[#64748b]">Representative frames will be extracted and analyzed for fluid motion and scene evolution</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Audio / Voice Note Evidence */}
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-center space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#0f172a] flex items-center justify-center gap-1.5">
                      <span>🎙️</span>
                      <span>Record Witness Voice Statement</span>
                    </h4>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      Speak your observations (landmarks, water rise velocity, time). AI will transcribe and extract corroborating claims.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer active:scale-95"
                      >
                        <span>🎙️</span>
                        <Mic className="w-4 h-4" />
                        Start Live Voice Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#e11d48] text-xs font-bold border border-[#e11d48] animate-pulse transition cursor-pointer shadow-xs"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        Stop Recording
                      </button>
                    )}
                  </div>

                  {audioPreviewUrl && (
                    <div className="pt-3 border-t border-[#e2e8f0] flex flex-col items-center space-y-2">
                      <audio src={audioPreviewUrl} controls className="w-full max-w-md" />
                      <button
                        type="button"
                        onClick={() => { setAudioFile(null); setAudioPreviewUrl(null); }}
                        className="text-[11px] text-[#e11d48] hover:underline font-semibold"
                      >
                        Remove Voice Recording
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-center text-[11px] text-[#64748b]">
                  Or upload an audio file:
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => e.target.files?.[0] && handleAudioFileSelection(e.target.files[0])}
                    className="ml-2 text-[#475569] text-xs"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: Document, PDF & Messy Field Notes */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                      <span>📄</span>
                      <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                      Document, Incident Dispatch or Messy Notes Ingestion
                    </h4>
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      Paste raw unstructured incident notes, flood damage reports, or upload a text/PDF file. Floodprint AI will extract locations, dates, key findings, and infrastructure impact.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono font-bold text-[#475569] mb-1">
                      Raw Text / Field Log / Dispatch Content
                    </label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Incident logged at 14:30 IST in Chittoor, Andhra Pradesh. Heavy monsoon downpour caused flash waterlogging along Gandhi Road. Drainage overflow submerged curbs and flooded commercial storefronts..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-[#64748b]">
                    <span>Supported formats: .txt, .pdf, .json, .log, field notes</span>
                    <label className="cursor-pointer text-[#0284c7] hover:underline font-bold font-mono">
                      <span>Import .txt / .log file</span>
                      <input
                        type="file"
                        accept=".txt,.log,.json,.csv,.md"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result as string;
                              if (text) {
                                setDescription(text);
                                if (!title) setTitle(`Extracted Log: ${file.name}`);
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {fileError && (
              <p className="text-xs text-[#e11d48] font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {fileError}
              </p>
            )}
          </div>

          {/* STEP 2: REAL LOCATION & INTERACTIVE GIS MAP */}
          <div className="p-6 rounded-3xl bg-white border border-[#e2e8f0] space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a] font-mono flex items-center gap-1.5">
                  <span>📍</span>
                  <Compass className="w-3.5 h-3.5 text-[#0284c7]" />
                  Spatial Telemetry &amp; Location Pin
                </label>
                <p className="text-[11px] text-[#64748b]">
                  Priority: 1. EXIF GPS &rarr; 2. Device GPS &rarr; 3. Map Pin &rarr; 4. Manual address.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0284c7] border border-[#cbd5e1] text-xs font-bold transition disabled:opacity-50 font-mono cursor-pointer"
              >
                {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                {locating ? 'Locating...' : 'Browser GPS'}
              </button>
            </div>

            {/* Interactive Leaflet Map with India/Chittoor Search */}
            <EvidenceMap
              latitude={latitude ? parseFloat(latitude) : 13.2172}
              longitude={longitude ? parseFloat(longitude) : 79.1003}
              address={address || 'Chittoor, Andhra Pradesh, India'}
              locationSource={locationSource}
              interactive={true}
              showSearch={true}
              onLocationSelect={(lat, lng, addr) => {
                setLatitude(lat.toString());
                setLongitude(lng.toString());
                setLocationSource('map_selected');
                setCoordError(null);
                if (addr) setAddress(addr);
              }}
              height="260px"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#64748b] mb-1">
                  LATITUDE
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => { setLatitude(e.target.value); setLocationSource('manual'); }}
                  placeholder="e.g. 13.2172"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#64748b] mb-1">
                  LONGITUDE
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => { setLongitude(e.target.value); setLocationSource('manual'); }}
                  placeholder="e.g. 79.1003"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#64748b] mb-1">
                  ADDRESS / ADMINISTRATIVE REGION
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Chittoor, Andhra Pradesh, India"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            {coordError && (
              <p className="text-xs text-[#e11d48] font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {coordError}
              </p>
            )}
          </div>

          {/* STEP 3: REAL TIME & CLOCK LAYER */}
          <div className="p-6 rounded-3xl bg-white border border-[#e2e8f0] space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a] font-mono flex items-center gap-1.5">
                <span>📅</span>
                <Clock className="w-3.5 h-3.5 text-[#0284c7]" />
                Temporal Alignment &amp; Clock Delta
              </label>
              <span className="text-[10px] font-mono text-[#0284c7] bg-[#0284c7]/10 px-2 py-0.5 rounded border border-[#0284c7]/20 font-bold">
                TZ: {localTimezone}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#475569] mb-1">
                  Claimed Incident Occurrence Time <span className="text-[#e11d48]">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={evidenceTimestamp}
                  onChange={(e) => setEvidenceTimestamp(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] focus:outline-none focus:border-[#0284c7] font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] text-xs space-y-1">
                <span className="text-[#64748b] block uppercase font-mono text-[10px] font-bold">Temporal Cross-Check</span>
                <p className="text-[#64748b] leading-relaxed text-[11px]">
                  Incident timestamp is correlated with EXIF capture date and Open-Meteo radar observation archives.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4: CLAIM NARRATIVE */}
          <div className="p-6 rounded-3xl bg-white border border-[#e2e8f0] space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0f172a] font-mono flex items-center gap-1.5">
                <span>📝</span>
                <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                Claim Title &amp; Submitter Narrative
              </label>
              <span className="text-[10px] font-mono text-[#94a3b8]">{description.length}/500</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#475569] mb-1">
                  Case Investigation Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Flash flooding along residential intersection"
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-[#475569] mb-1">
                  Witness Narrative / Context Observations
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe visible landmarks, water rise velocity, damaged vehicles, or source of water..."
                  className="w-full px-3 py-2 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#f1f5f9] text-xs font-semibold text-[#64748b] hover:text-[#0f172a] border border-[#cbd5e1] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer active:scale-95"
            >
              <span>✅</span>
              <ShieldCheck className="w-4 h-4" />
              <span>Submit &amp; Synthesize Multi-Signal Evidence</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
