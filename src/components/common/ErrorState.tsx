import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message,
  onRetry,
  onDismiss,
  className = '',
}) => {
  return (
    <div className={`p-4 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-xs text-[#f0f6fc] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-[#f43f5e]">{title}</h4>
            <p className="text-[#8b949e] leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#161b22] hover:bg-[#21262d] text-xs font-semibold text-[#f0f6fc] border border-[#30363d] transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 rounded-md hover:bg-[#161b22] text-[#8b949e] hover:text-[#f0f6fc] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
