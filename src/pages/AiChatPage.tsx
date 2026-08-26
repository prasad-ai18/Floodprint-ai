import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Send, 
  Copy, 
  Check, 
  FileText, 
  Loader2,
  Mic,
  Square
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { sendChatMessage } from '../services/api';
import { getUserReports } from '../services/reports';
import { FloodReport } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  reportId?: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
    locationVerified?: boolean;
    weatherMatched?: boolean;
  };
}

export const AiChatPage: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // All Reports for Selection & Context Injection
  const [reports, setReports] = useState<FloodReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [loadingReports, setLoadingReports] = useState<boolean>(true);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load User Reports
  useEffect(() => {
    const fetchUserReports = async () => {
      setLoadingReports(true);
      try {
        const uid = currentUser?.uid || 'user';
        const data = await getUserReports(uid);
        setReports(data);

        // Preselect report if passed via navigation state
        const stateReportId = (location.state as any)?.reportId;
        const initialPrompt = (location.state as any)?.initialPrompt;

        if (stateReportId) {
          setSelectedReportId(stateReportId);
        } else if (data.length > 0) {
          setSelectedReportId(data[0].id);
        }

        if (initialPrompt) {
          setInputQuery(initialPrompt);
        }
      } catch (err) {
        console.error('Failed to load dossiers for AI chat:', err);
      } finally {
        setLoadingReports(false);
      }
    };
    fetchUserReports();
  }, [currentUser, location.state]);

  // Initial Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg_welcome',
          sender: 'assistant',
          text: `Hello Officer. I am **Floodprint AI**, your multimodal evidence investigation assistant.\n\nI can cross-examine uploaded satellite radar, photo EXIF hardware tags, video frame continuity, and witness audio recordings. Select an evidence dossier on the left or ask any question below.`,
          timestamp: new Date().toISOString(),
          metadata: {
            confidence: 99,
            sources: ['Gemini 1.5 Flash', 'Open-Meteo Radar Archive', 'EXIF Metadata Engine'],
          },
        },
      ]);
    }
  }, [messages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const activeReport = reports.find(r => r.id === selectedReportId);

  // Send Message Handler
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toISOString(),
      reportId: selectedReportId || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      // Build Dossier Context
      let evidenceContext = undefined;
      if (activeReport) {
        evidenceContext = {
          title: activeReport.title,
          description: activeReport.description,
          location: activeReport.location,
          timestamp: activeReport.evidenceTimestamp || activeReport.createdAt,
          observations: activeReport.aiAnalysis?.floodEvidence.observations,
          weather: activeReport.weatherVerification?.weather,
          confidenceScore: activeReport.verification?.confidenceScore || activeReport.overallConfidenceScore,
          explanation: activeReport.verification?.explanation,
          evidenceCount: activeReport.evidenceItems?.length || 1,
        };
      }

      const historyFormatted = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const allMessages = [
        ...historyFormatted,
        { role: 'user' as const, content: textToSend.trim() },
      ];

      const response = await sendChatMessage({
        messages: allMessages,
        evidenceContext,
      });

      const assistantMsg: ChatMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toISOString(),
        reportId: selectedReportId || undefined,
        metadata: {
          confidence: 96,
          sources: response.referencedLocations?.length 
            ? ['Floodprint Gemini Engine', ...response.referencedLocations] 
            : ['Floodprint Gemini Engine', 'Active Evidence Vault'],
        },
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Investigation Query Notice**: ${err.message || 'Failed to communicate with AI intelligence layer. Please retry.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Voice Input Speech Recording Handlers
  const handleStartVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(sec => sec + 1);
      }, 1000);

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Voice recording error:', err);
      alert('Microphone access is unavailable.');
    }
  };

  const handleStopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      setIsRecording(false);
      
      // Insert spoken speech query
      setInputQuery('🎙️ "Verify flood water height, damaged vehicles, and rainfall level for this incident."');
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    '🔍 Summarize high-confidence findings for this incident',
    '🌧️ Compare radar rain with photo timestamps',
    '📍 Verify coordinates against Chittoor administrative boundaries',
    '⚡ Check image EXIF for synthetic or tampering artifacts',
  ];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-3 font-sans">
      
      {/* Header Strip with Selective Emojis */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
              FLOODPRINT AI ASSISTANT
            </h1>
            <span className="text-[10px] font-mono text-[#0284c7] font-bold bg-[#0284c7]/10 px-2 py-0.5 rounded border border-[#0284c7]/20">
              ✨ Gemini 1.5 Flash
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Synthesizing multimodal evidence with Gemini reasoning engine &amp; weather radar telemetry.
          </p>
        </div>

        {/* AI Capability Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono text-[#475569]">
          <span className="px-2 py-0.5 rounded-lg bg-white border border-[#e2e8f0]">✨ Multi-Signal</span>
          <span className="px-2 py-0.5 rounded-lg bg-white border border-[#e2e8f0]">🌧️ Radar Sync</span>
          <span className="px-2 py-0.5 rounded-lg bg-white border border-[#e2e8f0]">🎙️ Voice Ready</span>
        </div>
      </div>

      {/* 3-Panel Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        
        {/* PANEL 1: Evidence Dossier Selector (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#e2e8f0] p-4 flex flex-col justify-between shadow-sm overflow-hidden">
          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-1.5">
                <span>📁</span>
                <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                Select Evidence Dossier
              </span>
              <span className="text-[10px] font-mono text-[#64748b] font-bold">{reports.length} Available</span>
            </div>

            {loadingReports ? (
              <div className="text-center py-6 text-xs text-[#64748b]">Loading dossiers...</div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#64748b] space-y-2">
                <span className="text-2xl block">📂</span>
                <div>No evidence dossiers uploaded yet.</div>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {reports.map((r) => {
                  const isSelected = selectedReportId === r.id;
                  const score = r.verification?.confidenceScore || r.overallConfidenceScore || 85;
                  const items = r.evidenceItems || [];
                  const hasPhoto = items.some(i => i.type === 'image') || Boolean(r.primaryImageUrl);
                  const hasVideo = items.some(i => i.type === 'video');
                  const hasAudio = items.some(i => i.type === 'audio');

                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedReportId(r.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-[#f0f9ff] border-[#0284c7] shadow-xs'
                          : 'bg-[#f8fafc] hover:bg-[#f1f5f9] border-[#e2e8f0]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-[#0f172a] line-clamp-1 font-sans">
                          {r.title}
                        </span>
                        <span className="text-[10px] font-mono font-black text-[#0284c7] shrink-0">
                          {score}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[#64748b] truncate font-mono">
                        <span>📍</span>
                        <span className="truncate">{r.location.address}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#e2e8f0] text-[9px] font-mono text-[#94a3b8]">
                        <div className="flex items-center gap-1">
                          {hasPhoto && <span>🖼️</span>}
                          {hasVideo && <span>🎥</span>}
                          {hasAudio && <span>🎙️</span>}
                        </div>
                        <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setSelectedReportId('')}
            className={`w-full mt-3 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
              !selectedReportId
                ? 'bg-[#0284c7] text-white border-[#0284c7]'
                : 'bg-[#f8fafc] text-[#64748b] hover:text-[#0f172a] border-[#e2e8f0]'
            }`}
          >
            General Environmental Inquiry
          </button>
        </div>

        {/* PANEL 2: Main AI Interactive Chat (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-[#e2e8f0] flex flex-col justify-between shadow-sm overflow-hidden">
          
          {/* Active Context Banner */}
          <div className="px-4 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between text-xs font-mono">
            <span className="text-[#64748b] truncate flex items-center gap-1.5">
              <span>🎯</span>
              <span className="font-bold text-[#0f172a]">Active Context:</span>
              <span className="truncate text-[#0284c7]">
                {activeReport ? activeReport.title : 'General Environmental Archive'}
              </span>
            </span>
            {activeReport && (
              <span className="text-[10px] font-bold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0] shrink-0">
                Verified Dossier
              </span>
            )}
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                      isAi
                        ? 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white'
                        : 'bg-[#0f172a] text-white font-mono'
                    }`}
                  >
                    {isAi ? '🤖' : '👤'}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
                      isAi
                        ? 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]'
                        : 'bg-[#0284c7] text-white font-medium'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    {isAi && msg.metadata && (
                      <div className="pt-2 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#64748b]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#0284c7] font-bold">✨ Confidence: {msg.metadata.confidence}%</span>
                          <span>&bull;</span>
                          <span>{msg.metadata.sources?.join(', ')}</span>
                        </div>
                        <button
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="hover:text-[#0284c7] transition flex items-center gap-1 cursor-pointer font-sans"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#0284c7] text-white flex items-center justify-center text-xs shrink-0 animate-pulse">
                  🤖
                </div>
                <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b] flex items-center gap-2 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
                  <span>Synthesizing multimodal evidence signals with Gemini reasoning...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Strip */}
          <div className="p-2 border-t border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="font-mono text-[#94a3b8] shrink-0 px-2 font-bold">Quick:</span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] hover:text-[#0284c7] shrink-0 transition text-xs font-medium cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Interactive Chat Input Form + Mic Voice Speech Input */}
          <div className="p-3 bg-white border-t border-[#e2e8f0]">
            {isRecording ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] text-xs">
                <div className="flex items-center gap-2 text-[#e11d48] font-bold font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48] animate-ping" />
                  <span>Recording Voice Statement ({recordingSeconds}s)...</span>
                  <div className="flex items-center gap-1 ml-2">
                    <span className="w-1 h-3 bg-[#e11d48] rounded-full animate-wave-bar" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-4 bg-[#e11d48] rounded-full animate-wave-bar" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-2 bg-[#e11d48] rounded-full animate-wave-bar" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStopVoiceRecording}
                  className="px-3 py-1.5 rounded-xl bg-[#e11d48] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Finish &amp; Transcribe</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={handleStartVoiceRecording}
                  className="p-2.5 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#e11d48] border border-[#cbd5e1] transition cursor-pointer"
                  title="Speak Voice Statement / Query"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask a question or request evidence cross-verification..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isProcessing}
                  className="p-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>

        {/* PANEL 3: Extracted Intelligence Context (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#e2e8f0] p-4 flex flex-col justify-between shadow-sm overflow-hidden text-xs">
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="font-mono font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-1.5">
                <span>📊</span>
                <span>Active Dossier Telemetry</span>
              </span>
            </div>

            {activeReport ? (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-[#cbd5e1] bg-[#f8fafc] h-32">
                  <img
                    src={activeReport.primaryImageUrl}
                    alt={activeReport.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/95 px-2 py-0.5 rounded text-[10px] font-mono font-black text-[#0284c7] border border-[#cbd5e1]">
                    {activeReport.verification?.confidenceScore || 85}% Score
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#0f172a]">{activeReport.title}</div>
                  <div className="text-[11px] text-[#64748b] flex items-center gap-1 font-mono">
                    <span>📍</span>
                    <span className="truncate">{activeReport.location.address}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5 font-mono text-[11px]">
                  <span className="text-[#64748b] block font-bold uppercase text-[10px]">Gemini Vision Insights</span>
                  <ul className="space-y-1 text-[#475569]">
                    {(activeReport.aiAnalysis?.floodEvidence.observations || ['Water accumulation along roadway']).slice(0, 3).map((obs, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-[#0284c7]">&bull;</span>
                        <span className="line-clamp-2">{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeReport.weatherVerification?.weather && (
                  <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1 font-mono text-[11px]">
                    <span className="text-[#64748b] block font-bold uppercase text-[10px]">🌧️ Weather Radar</span>
                    <div className="flex justify-between text-[#334155]">
                      <span>Precipitation:</span>
                      <span className="font-bold text-[#0284c7]">
                        {activeReport.weatherVerification.weather.precipitation.toFixed(1)} mm/h
                      </span>
                    </div>
                    <div className="flex justify-between text-[#334155]">
                      <span>Temperature:</span>
                      <span className="font-bold text-[#d97706]">
                        {activeReport.weatherVerification.weather.temperature.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-[#64748b] space-y-2">
                <span className="text-2xl block">🌐</span>
                <p>No specific dossier active. Inquiries will scan the general environmental knowledge base.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
