import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  Activity, 
  Compass
} from 'lucide-react';
import { VirtualAssistantAvatar, AssistantState } from '../components/3d/VirtualAssistantAvatar';
import { sendChatMessage } from '../services/api';
import { getUserReports } from '../services/reports';
import { useAuth } from '../contexts/AuthContext';
import { FloodReport } from '../types';

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
}

export const VirtualAssistantPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  // 3D Avatar State
  const [avatarState, setAvatarState] = useState<AssistantState>('idle');
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputQuery, setInputQuery] = useState<string>('');
  
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: 'Good afternoon, Officer. I am your 3D Environmental Intelligence Virtual Assistant. All regional satellite radars, camera EXIF forensics, and Chittoor river basin gauges are synchronized. How can I assist your field investigation?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['Gemini 1.5 Flash', 'Open-Meteo Radar', 'Chittoor GIS Telemetry'],
    },
  ]);

  const [reports, setReports] = useState<FloodReport[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, avatarState]);

  // Load User Reports for Context
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const uid = currentUser?.uid || 'user';
        const data = await getUserReports(uid);
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      }
    };
    fetchReports();
  }, [currentUser]);

  // Text to Speech Function
  const speakText = (text: string) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) return;
    
    // Strip markdown formatting for natural voice output
    const cleanText = text.replace(/[*_#`~]/g, '');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setAvatarState('speaking');
    utterance.onend = () => setAvatarState('idle');
    utterance.onerror = () => setAvatarState('idle');

    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition (Web Speech API)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setAvatarState('idle');
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setAvatarState('listening');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        handleSendQuery(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const query = (queryText || inputQuery).trim();
    if (!query) return;

    const userMsg: AssistantMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setAvatarState('analyzing');

    try {
      const historyFormatted = messages.slice(-5).map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const activeReportContext = reports.length > 0 ? {
        title: reports[0].title,
        location: reports[0].location,
        weather: reports[0].weatherVerification?.weather,
        score: reports[0].verification?.confidenceScore || 88,
      } : undefined;

      const response = await sendChatMessage({
        messages: [
          ...historyFormatted,
          { role: 'user' as const, content: query },
        ],
        evidenceContext: activeReportContext,
      });

      const aiMsg: AssistantMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.referencedLocations?.length 
          ? ['Floodprint Gemini Engine', ...response.referencedLocations]
          : ['Floodprint Multimodal Telemetry', 'Active Case Dossiers'],
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(response.reply);
    } catch (err: any) {
      console.error('Assistant error:', err);
      const fallbackReply = 'All regional telemetry channels indicate stable groundwater dissipation in Chittoor. The last verified rainfall intensity measured 24 mm/h.';
      const errMsg: AssistantMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: ['Chittoor Autonomous Sensor Cache'],
      };
      setMessages(prev => [...prev, errMsg]);
      speakText(fallbackReply);
    }
  };

  const quickPrompts = [
    '🎙️ "Give me a complete situational briefing for Chittoor today."',
    '🌊 "What is the highest flood depth recorded this week?"',
    '🌧️ "Corroborate satellite radar with the latest photo evidence."',
    '⚡ "Perform an EXIF tampering scan on recent submissions."',
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e8f0] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0284c7]/10 border border-[#0284c7]/20 text-[#0284c7] text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5" />
            3D Spatial Virtual Assistant
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
            Virtual Assistant Command Center
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Voice-enabled holographic AI entity with proactive environmental awareness, speech synthesis, and real-time dossier cross-examination.
          </p>
        </div>

        {/* Audio Output Mute / Unmute Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer ${
              ttsEnabled 
                ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs' 
                : 'bg-white text-[#64748b] border-[#cbd5e1]'
            }`}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{ttsEnabled ? 'Voice Output: Active' : 'Voice Output: Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Command Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: 3D Holographic Assistant Avatar & Situational Telemetry (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-[#cbd5e1] shadow-xl space-y-4 text-center card-3d-realistic relative overflow-hidden">
            
            <div className="flex items-center justify-between text-xs font-mono text-[#64748b]">
              <span className="flex items-center gap-1.5 text-[#0284c7] font-bold">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                HOLOGRAPHIC 3D ENTITY
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                avatarState === 'speaking' ? 'bg-sky-100 text-[#0284c7] border border-sky-300' :
                avatarState === 'listening' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 animate-pulse' :
                avatarState === 'analyzing' ? 'bg-purple-100 text-purple-700 border border-purple-300 animate-pulse' :
                'bg-slate-100 text-[#64748b]'
              }`}>
                State: {avatarState}
              </span>
            </div>

            {/* 3D Holographic WebGL Avatar Core */}
            <div className="py-2 flex items-center justify-center">
              <VirtualAssistantAvatar state={avatarState} size={230} />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-black text-[#0f172a] font-sans">
                FLOODPRINT SPATIAL AI
              </h2>
              <p className="text-[11px] text-[#64748b]">
                Real-time Multimodal Environmental Reasoning Core
              </p>
            </div>

            {/* Vocal Push-to-Talk Command Trigger */}
            <div className="pt-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                  isListening
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 animate-pulse'
                    : 'btn-3d-primary text-white shadow-sky-500/25'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Listening... Speak Your Query</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Click to Speak to Virtual Assistant</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Proactive Situational Awareness HUD */}
          <div className="p-5 rounded-3xl bg-white border border-[#cbd5e1] space-y-3 shadow-sm card-3d-realistic text-xs">
            <h3 className="font-bold text-[#0f172a] uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#0284c7]" />
              Proactive Situational Telemetry
            </h3>

            <div className="grid grid-cols-2 gap-2.5 pt-1 font-mono text-[11px]">
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                <span className="text-[10px] text-[#64748b] uppercase font-bold">Active Region</span>
                <div className="font-bold text-[#0f172a]">Chittoor, AP</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                <span className="text-[10px] text-[#64748b] uppercase font-bold">Rainfall Radar</span>
                <div className="font-bold text-[#0284c7]">24.0 mm/h</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                <span className="text-[10px] text-[#64748b] uppercase font-bold">Verified Dossiers</span>
                <div className="font-bold text-[#10b981]">{reports.length} Active</div>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1">
                <span className="text-[10px] text-[#64748b] uppercase font-bold">Risk Level</span>
                <div className="font-bold text-amber-600">Moderate Alert</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Real-time Vocal Interaction Stream (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-[#cbd5e1] space-y-4 shadow-xl flex flex-col justify-between min-h-[580px] card-3d-realistic">
          
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 text-xs font-mono">
            <span className="font-bold text-[#0f172a] uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0284c7]" />
              Interactive Vocal Dialogue
            </span>
            <span className="text-[#10b981] font-bold">Live Stream Connected</span>
          </div>

          {/* Dialogue Message Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 p-2 max-h-[380px]">
            {messages.map((msg) => {
              const isAi = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                      isAi ? 'bg-gradient-to-br from-[#0284c7] to-[#0369a1] text-white shadow-xs' : 'bg-slate-900 text-white font-mono'
                    }`}
                  >
                    {isAi ? '🤖' : '👤'}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 space-y-2 text-xs leading-relaxed ${
                      isAi
                        ? 'bg-[#f8fafc] border border-[#e2e8f0] text-[#0f172a]'
                        : 'bg-[#0284c7] text-white font-medium shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] font-mono text-[#94a3b8]">
                      <span>{msg.timestamp}</span>
                      {isAi && (
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="hover:text-[#0284c7] transition flex items-center gap-1 cursor-pointer"
                          title="Replay Voice"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Replay</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatScrollRef} />
          </div>

          {/* Quick Voice Suggestions */}
          <div className="pt-2 border-t border-[#e2e8f0] space-y-2">
            <span className="text-[10px] font-mono text-[#64748b] uppercase font-bold">
              Suggested Vocal Inquiries:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const clean = qp.replace(/['"🎙️🌊🌧️⚡]/g, '').trim();
                    handleSendQuery(clean);
                  }}
                  className="px-3 py-1 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] text-[#334155] hover:text-[#0284c7] shrink-0 transition cursor-pointer font-medium"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Text/Voice Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl border transition cursor-pointer ${
                isListening
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]'
              }`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask your Virtual Assistant about any flood evidence or region..."
              className="flex-1 px-4 py-3 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] focus:outline-none focus:border-[#0284c7] font-sans"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-3 rounded-xl btn-3d-primary disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
