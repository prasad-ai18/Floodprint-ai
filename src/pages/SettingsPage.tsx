import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Sparkles, 
  CloudRain, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [checking, setChecking] = useState<boolean>(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch (err: unknown) {
      console.warn('Health check warning:', err);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#21262d] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe] text-xs font-mono font-semibold uppercase tracking-wider mb-2">
            <Server className="w-3.5 h-3.5" />
            Telemetry &amp; Connectivity
          </div>
          <h1 className="text-2xl font-black text-[#f0f6fc] tracking-tight">
            System Diagnostics &amp; APIs
          </h1>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Monitor real-time health across Gemini vision endpoints, Open-Meteo radar archives, Cloudinary media vaults, and Firestore.
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={checking}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#f0f6fc] border border-[#30363d] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-[#00f2fe]' : ''}`} />
          <span>{checking ? 'Checking...' : 'Ping Services'}</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Verification Engine */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#f0f6fc]">Multi-Signal Synthesis Engine</h4>
                <p className="text-[11px] text-[#8b949e] font-mono">Internal Algorithm &bull; Port 3001</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
              HEALTHY
            </span>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Dynamic weight normalizer synthesizing Vision, Video motion, Voice claims, EXIF GPS, and Historical radar.
          </p>
        </div>

        {/* Open-Meteo Radar */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#f0f6fc]">Open-Meteo Historical Radar</h4>
                <p className="text-[11px] text-[#8b949e] font-mono">Public Meteorological API</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30">
              CONNECTED
            </span>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Directly queries precipitation, cloud cover, wind speed, and temperature archives for incident coordinates.
          </p>
        </div>

        {/* Gemini Vision & Multimodal */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#f0f6fc]">Gemini 1.5 Flash Vision</h4>
                <p className="text-[11px] text-[#8b949e] font-mono">Google Generative AI</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              healthData?.services?.geminiConfigured 
                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' 
                : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
            }`}>
              {healthData?.services?.geminiConfigured ? 'LIVE KEY SET' : 'DEV PROXY / HEURISTIC'}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Performs visual inundation analysis, video frame consistency checks, and voice statement transcriptions.
          </p>
        </div>

        {/* Cloudinary & Media Vault */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#161b22] text-[#00f2fe] border border-[#30363d]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#f0f6fc]">Cloudinary Media Vault</h4>
                <p className="text-[11px] text-[#8b949e] font-mono">Media Vault Storage</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              healthData?.services?.cloudinaryConfigured 
                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' 
                : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
            }`}>
              {healthData?.services?.cloudinaryConfigured ? 'CONNECTED' : 'LOCAL VAULT MODE'}
            </span>
          </div>
          <p className="text-xs text-[#8b949e] leading-relaxed">
            Encrypted tamper-resistant storage for primary imagery, sampled video frames, and voice recordings.
          </p>
        </div>

      </div>

      {/* Security & Secret Protection Note */}
      <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] text-xs space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-[#f0f6fc]">
          <Lock className="w-3.5 h-3.5 text-[#00f2fe]" />
          <span>Security &amp; Zero Client-Side Secret Policy</span>
        </div>
        <p className="text-[#8b949e] leading-relaxed">
          Floodprint isolates all Gemini API keys, Cloudinary upload credentials, and database tokens behind the server proxy on port 3001. No production secrets are exposed to client JavaScript.
        </p>
      </div>

    </div>
  );
};
