import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, LayoutDashboard, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0d1117]/90 border-b border-[#21262d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#00f2fe] to-[#0284c7] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-[#f0f6fc] font-mono">
                FLOODPRINT
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-[#161b22] text-[#00f2fe] border border-[#30363d]' 
                  : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/submit"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isActive('/submit')
                  ? 'bg-[#00f2fe] text-slate-950 font-bold'
                  : 'bg-[#161b22] hover:bg-[#21262d] text-[#00f2fe] border border-[#30363d]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Submit Evidence</span>
            </Link>
          </nav>

          {/* User Auth Info */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#161b22] border border-[#30363d] text-xs text-[#8b949e]">
                  <User className="w-3.5 h-3.5 text-[#00f2fe]" />
                  <span className="max-w-[140px] truncate text-[#f0f6fc]">{currentUser.email || 'User'}</span>
                </div>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f43f5e] hover:bg-[#161b22] transition border border-transparent hover:border-[#30363d]"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#00f2fe] text-slate-950 shadow transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
