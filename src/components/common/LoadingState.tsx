import React from 'react';
import { Loader2, Sparkles, UploadCloud, Database } from 'lucide-react';

export type LoadingStage = 'uploading' | 'analyzing' | 'saving' | 'processing' | 'default';

interface LoadingStateProps {
  stage?: LoadingStage;
  message?: string;
  progress?: number;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  stage = 'default',
  message,
  progress,
  className = '',
}) => {
  const getIcon = () => {
    switch (stage) {
      case 'uploading':
        return <UploadCloud className="w-6 h-6 text-[#00f2fe] animate-bounce" />;
      case 'analyzing':
        return <Sparkles className="w-6 h-6 text-[#00f2fe] animate-pulse" />;
      case 'saving':
        return <Database className="w-6 h-6 text-[#10b981] animate-pulse" />;
      default:
        return <Loader2 className="w-6 h-6 text-[#00f2fe] animate-spin" />;
    }
  };

  const getDefaultMessage = () => {
    switch (stage) {
      case 'uploading':
        return 'Uploading flood evidence to media vault...';
      case 'analyzing':
        return 'AI Vision analyzing flood levels & environmental consistency...';
      case 'saving':
        return 'Saving verified evidence dossier to database...';
      case 'processing':
        return 'Synthesizing weather data & multi-signal score...';
      default:
        return 'Processing request...';
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-[#0d1117] border border-[#21262d] ${className}`}>
      <div className="relative mb-3">
        <div className="p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
          {getIcon()}
        </div>
      </div>
      
      <p className="text-sm font-semibold text-[#f0f6fc]">
        {message || getDefaultMessage()}
      </p>

      {progress !== undefined && (
        <div className="w-full max-w-xs mt-3">
          <div className="flex justify-between text-xs font-mono text-[#8b949e] mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#161b22] rounded-full overflow-hidden border border-[#30363d]">
            <div 
              className="h-full bg-[#00f2fe] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
