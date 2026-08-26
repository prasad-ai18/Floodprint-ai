import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplets, PlusCircle, LayoutDashboard, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, logout, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Flood<span className="text-cyan-400">print</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                AI Evidence Engine
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/submit"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all ${
                isActive('/submit')
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/20'
                  : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-700/50'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Evidence</span>
            </Link>
          </nav>

          {/* User Auth Info */}
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/80">
                <ShieldCheck className="w-3 h-3" />
                Demo Mode
              </span>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[120px] truncate">{currentUser.email || 'User'}</span>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition border border-transparent hover:border-rose-900/50"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
