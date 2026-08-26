import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ShieldCheck, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ErrorState } from '../components/common/ErrorState';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, signup, loading, error, clearError, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, displayName);
      }
      navigate('/');
    } catch {
      // Handled by AuthContext
    }
  };

  const handleDemoSignIn = async () => {
    try {
      await login('demo.verifier@floodprint.ai', 'demo123456');
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 rounded-2xl bg-[#0d1117] border border-[#21262d] shadow-2xl space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-[#00f2fe] to-[#0284c7] shadow-lg shadow-cyan-500/20 mb-1">
          <Activity className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <h2 className="text-xl font-black text-[#f0f6fc] tracking-tight">
          {isLogin ? 'Sign In to Floodprint' : 'Create Verifier Account'}
        </h2>
        <p className="text-xs text-[#8b949e]">
          AI &amp; Environmental Disaster Evidence Verification Platform
        </p>
      </div>

      {isDemoMode && (
        <div className="p-3.5 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] text-xs space-y-2 font-mono">
          <div className="flex items-center gap-1.5 font-bold text-[#f0f6fc]">
            <ShieldCheck className="w-4 h-4 text-[#f59e0b]" />
            <span>Development / Demo Mode Active</span>
          </div>
          <p className="text-[11px] text-[#8b949e] font-sans leading-relaxed">
            One-click bypass sign in with investigator demo credentials.
          </p>
          <button
            type="button"
            onClick={handleDemoSignIn}
            className="w-full py-2 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs transition font-sans"
          >
            One-Click Demo Sign In
          </button>
        </div>
      )}

      {(formError || error) && (
        <ErrorState message={formError || error || ''} onDismiss={() => { setFormError(null); clearError(); }} />
      )}

      {/* Auth Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {!isLogin && (
          <div>
            <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
              FULL NAME / IDENTIFIER
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Disaster Response Officer"
              className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="verifier@floodprint.ai"
            required
            className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-[#8b949e] mb-1">
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3 py-2 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#f0f6fc] placeholder-[#6e7681] focus:outline-none focus:border-[#00f2fe]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 rounded-lg bg-[#00f2fe] hover:bg-[#38bdf8] text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLogin ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
        </button>
      </form>

      {/* Switch Mode */}
      <div className="text-center text-xs text-[#8b949e] pt-2 border-t border-[#21262d]">
        {isLogin ? (
          <>
            Need an account?{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(false); clearError(); }}
              className="text-[#00f2fe] font-semibold hover:underline"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => { setIsLogin(true); clearError(); }}
              className="text-[#00f2fe] font-semibold hover:underline"
            >
              Sign In
            </button>
          </>
        )}
      </div>

    </div>
  );
};
