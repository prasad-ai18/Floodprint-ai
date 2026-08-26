import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { login, signup, loginWithGoogle, resetPassword, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignUp, setIsSignUp] = useState<boolean>(location.pathname === '/signup');
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetEmail, setResetEmail] = useState<string>('');

  // UI States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [googleSubmitting, setGoogleSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email.trim() || !password.trim()) {
      setValidationError('Please fill in both email and password.');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setValidationError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setValidationError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setValidationError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isSignUp) {
        await signup(email.trim(), password, name.trim());
      } else {
        await login(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Auth submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setValidationError(null);
    setGoogleNotice(null);
    clearError();
    setGoogleSubmitting(true);

    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('not configured') || msg.includes('auth/operation-not-allowed') || msg.includes('configuration')) {
        setGoogleNotice('Google Sign-In provider is not enabled in Firebase Console. You can sign in using Email/Password.');
      } else if (!msg.includes('popup-closed-by-user')) {
        setValidationError(msg || 'Google Authentication failed.');
      }
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setSubmitting(true);
    try {
      await resetPassword(resetEmail.trim());
      setResetSuccessMessage(`Password recovery link sent to ${resetEmail.trim()}`);
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccessMessage(null);
      }, 3500);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to send password reset email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#0369a1] shadow-md shadow-sky-500/20 mb-2">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0f172a] tracking-tight">
            FLOODPRINT
          </h1>
          <p className="text-xs text-[#64748b] font-medium tracking-wide uppercase">
            AI Evidence Verification Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#e2e8f0] shadow-xl shadow-slate-200/50 space-y-6">
          
          {/* Tabs */}
          <div className="flex rounded-xl bg-[#f1f5f9] p-1 border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); clearError(); setValidationError(null); setGoogleNotice(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                !isSignUp 
                  ? 'bg-white text-[#0284c7] shadow-xs' 
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); clearError(); setValidationError(null); setGoogleNotice(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                isSignUp 
                  ? 'bg-white text-[#0284c7] shadow-xs' 
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error / Notices */}
          {(validationError || authError) && (
            <div className="p-3.5 rounded-xl bg-[#fff1f2] border border-[#fecdd3] text-xs text-[#e11d48] flex items-start gap-2.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError || authError}</span>
            </div>
          )}

          {googleNotice && (
            <div className="p-3.5 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] text-xs text-[#1e40af] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
              <span>{googleNotice}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase font-mono mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Officer Ramanujam"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#475569] uppercase font-mono mb-1.5">
                Official / Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@floodprint.gov.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#475569] uppercase font-mono">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setResetEmail(email); }}
                    className="text-[11px] text-[#0284c7] hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-[#475569] uppercase font-mono mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || googleSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-md shadow-sky-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Official Account' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#e2e8f0] w-full" />
            <span className="bg-white px-3 text-[11px] font-mono text-[#94a3b8] uppercase font-bold relative">
              Or
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting || googleSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#f8fafc] border border-[#cbd5e1] text-xs font-bold text-[#0f172a] transition flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {googleSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.9l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#64748b]">
          Authorized access only &bull; Secured with Firebase &amp; Role-based telemetry
        </p>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#0f172a]">Reset Account Password</h3>
            <p className="text-xs text-[#64748b]">
              Enter your registered email address to receive password recovery instructions.
            </p>

            {resetSuccessMessage && (
              <div className="p-3 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#059669] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="officer@floodprint.gov.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] text-xs text-[#0f172a] placeholder-[#94a3b8] focus:outline-none focus:border-[#0284c7]"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs shadow-sm transition"
                >
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
