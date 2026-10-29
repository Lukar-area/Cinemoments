import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import {
  Film,
  Bell,
  User as UserIcon,
  LogOut,
  Sparkles,
  Menu,
  X,
  CheckCheck,
  ShieldCheck,
  Ticket,
  Plus,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { WalletTopupModal } from './WalletTopupModal.jsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Play cinematic auditorium chime
  const playAuditoriumChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [440, 554.37, 659.25, 880]; // A Major Cinema Chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 1.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 1.5);
      });
    } catch (e) {
      console.warn('Audio chime unsupported:', e);
    }
  };

  const toggleCinemaSound = () => {
    if (!audioEnabled) {
      playAuditoriumChime();
    }
    setAudioEnabled(!audioEnabled);
  };

  // Close popups on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#CBC3E3]/70 shadow-sm shadow-[#9F2B68]/5 transition-all duration-300">
      {/* Top Subtle Anamorphic Flare Accent: Amaranth & Bright Purple */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#9F2B68] to-transparent opacity-80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo with Amaranth / Iris Glow */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] flex items-center justify-center shadow-lg shadow-[#9F2B68]/25 border border-white/50 group-hover:scale-105 group-hover:shadow-glow-amaranth transition-all duration-300">
                <Film className="w-6 h-6 text-white transform group-hover:rotate-12 transition-transform duration-300" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#9F2B68] border-2 border-white animate-pulse" title="System Online" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinema text-xl sm:text-2xl font-black tracking-wider amaranth-metallic-text">
                  CINEMOMENTS
                </span>
                <span className="hidden sm:inline-block text-[9px] px-2 py-0.5 rounded-full bg-[#E6E6FA] border border-[#CBC3E3] text-[#5D3FD3] font-mono tracking-widest font-bold">
                  4K LASER
                </span>
              </div>
              <span className="block text-[10px] text-[#915F6D] tracking-[0.25em] font-medium uppercase">
                Theatrical Intermission Experience
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              to="/theatres"
              className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                isActive('/theatres')
                  ? 'text-[#9F2B68] bg-[#E6E6FA] border border-[#CBC3E3] shadow-sm'
                  : 'text-[#483248] hover:text-[#9F2B68] hover:bg-[#F3F3FD]'
              }`}
            >
              Theatres
            </Link>
            <Link
              to="/movies"
              className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                isActive('/movies')
                  ? 'text-[#9F2B68] bg-[#E6E6FA] border border-[#CBC3E3] shadow-sm'
                  : 'text-[#483248] hover:text-[#9F2B68] hover:bg-[#F3F3FD]'
              }`}
            >
              Movies
            </Link>
            <Link
              to="/book"
              className="btn-cinema-shimmer flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold text-white bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:from-[#BA3E7F] hover:to-[#7A60DE] shadow-lg shadow-[#9F2B68]/25 hover:shadow-glow-amaranth transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 text-white" />
              Book Interval
            </Link>

            {user?.role === 'CUSTOMER' && (
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                  isActive('/dashboard')
                    ? 'text-[#9F2B68] bg-[#E6E6FA] border border-[#CBC3E3]'
                    : 'text-[#483248] hover:text-[#9F2B68] hover:bg-[#F3F3FD]'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-[#9F2B68]" />
                My Bookings
              </Link>
            )}

            {user?.role === 'STAFF' && (
              <Link
                to="/staff"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                  isActive('/staff')
                    ? 'text-[#800020] bg-[#E6E6FA] border border-[#CBC3E3]'
                    : 'text-[#483248] hover:text-[#800020] hover:bg-[#F3F3FD]'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-[#800020]" />
                Projection Booth
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
                  isActive('/admin')
                    ? 'text-[#5D3FD3] bg-[#E6E6FA] border border-[#5D3FD3]/30'
                    : 'text-[#483248] hover:text-[#5D3FD3] hover:bg-[#F3F3FD]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#5D3FD3]" />
                Admin Console
              </Link>
            )}
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cinema Audio Chime Toggle */}
            <button
              type="button"
              onClick={toggleCinemaSound}
              title={audioEnabled ? "Cinema Chime Active (Click to mute)" : "Enable Cinema Soundscape Chime"}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-[#E6E6FA] border-[#9F2B68]/50 text-[#9F2B68] shadow-sm'
                  : 'bg-white border-[#CBC3E3] text-[#702963] hover:text-[#9F2B68] hover:bg-[#F3F3FD]'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-[#9F2B68] animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Wallet Balance Badge with Quick Top-Up */}
            {user && (
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E6E6FA] hover:bg-[#DDD7EC] border border-[#CBC3E3] text-xs font-semibold text-[#301934] transition-all cursor-pointer group shadow-sm"
                title="Click to recharge wallet"
              >
                <span className="text-[#9F2B68]">💳</span>
                <span className="font-mono font-bold tracking-tight text-[#9F2B68]">
                  ₹{Number(user.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="w-4 h-4 rounded-full bg-[#9F2B68] text-white flex items-center justify-center text-[10px] font-bold group-hover:scale-110 transition-transform ml-0.5">
                  <Plus className="w-3 h-3" />
                </span>
              </button>
            )}

            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2.5 rounded-xl bg-white hover:bg-[#F3F3FD] text-[#483248] hover:text-[#9F2B68] border border-[#CBC3E3] transition-all shadow-sm"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#9F2B68] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-5 py-4 border-b border-[#CBC3E3] flex items-center justify-between bg-[#F8F6FC]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#9F2B68]" />
                        <span className="font-cinema text-xs font-bold uppercase tracking-wider text-[#301934]">
                          Auditorium Dispatch
                        </span>
                        {unreadCount > 0 && (
                          <span className="bg-[#9F2B68] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-[#702963] hover:text-[#9F2B68] flex items-center gap-1 font-semibold transition-colors">
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-[#E6E6FA]">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-[#915F6D] text-xs font-mono">
                          No auditorium updates at this moment.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.is_read) markAsRead(notif.id);
                              if (user.role === 'CUSTOMER') navigate('/dashboard');
                              if (user.role === 'STAFF') navigate('/staff');
                              setShowNotifs(false);
                            }}
                            className={`p-4 transition-colors cursor-pointer hover:bg-[#F3F3FD] ${
                              !notif.is_read ? 'bg-[#E6E6FA]/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-[#301934]">{notif.title}</h4>
                              {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#9F2B68] shrink-0 mt-1" />}
                            </div>
                            <p className="text-xs text-[#5E435E] mt-1 line-clamp-2">{notif.message}</p>
                            <span className="text-[10px] text-[#AA98A9] mt-2 block font-mono">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                              • {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white hover:bg-[#F3F3FD] border border-[#CBC3E3] text-[#301934] transition-all shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] flex items-center justify-center text-white font-black text-xs shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-bold leading-tight text-[#301934]">{user.name}</span>
                    <span className="block text-[10px] text-[#9F2B68] font-mono tracking-wider uppercase font-bold">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-3 w-56 rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-[#E6E6FA] mb-1">
                      <p className="text-[10px] text-[#915F6D] uppercase tracking-wider font-bold">Director Access</p>
                      <p className="text-xs font-bold text-[#301934] truncate">{user.email}</p>
                    </div>

                    {user.role === 'CUSTOMER' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#483248] hover:text-[#9F2B68] hover:bg-[#F3F3FD] rounded-xl transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-[#9F2B68]" />
                        My Bookings & Passes
                      </Link>
                    )}

                    {user.role === 'STAFF' && (
                      <Link
                        to="/staff"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#483248] hover:text-[#800020] hover:bg-[#F3F3FD] rounded-xl transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-[#800020]" />
                        Projection Console
                      </Link>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#483248] hover:text-[#5D3FD3] hover:bg-[#F3F3FD] rounded-xl transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#5D3FD3]" />
                        Super Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#800020] hover:bg-[#800020]/10 rounded-xl transition-colors text-left mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#483248] hover:text-[#9F2B68] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs uppercase tracking-wider font-bold rounded-xl bg-white hover:bg-[#F3F3FD] text-[#9F2B68] border-2 border-[#9F2B68] transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-white border border-[#CBC3E3] text-[#483248] hover:text-[#9F2B68]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 border-b border-[#CBC3E3] bg-white/95 space-y-2 backdrop-blur-2xl">
          <Link
            to="/theatres"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-[#301934] hover:bg-[#F3F3FD] text-xs uppercase tracking-wider font-bold"
          >
            Theatres
          </Link>
          <Link
            to="/movies"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-[#301934] hover:bg-[#F3F3FD] text-xs uppercase tracking-wider font-bold"
          >
            Movies
          </Link>
          <Link
            to="/book"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-white bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-xs uppercase tracking-wider font-bold text-center shadow-lg"
          >
            Book an Interval
          </Link>

          {user?.role === 'CUSTOMER' && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-[#301934] hover:bg-[#F3F3FD] text-xs uppercase tracking-wider font-bold"
            >
              My Bookings
            </Link>
          )}

          {user?.role === 'STAFF' && (
            <Link
              to="/staff"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-[#800020] hover:bg-[#F3F3FD] text-xs uppercase tracking-wider font-bold"
            >
              Projection Booth
            </Link>
          )}

          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-[#5D3FD3] hover:bg-[#F3F3FD] text-xs uppercase tracking-wider font-bold"
            >
              Admin Panel
            </Link>
          )}
        </div>
      )}

      {/* Wallet Recharge Modal */}
      <WalletTopupModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </nav>
  );
};
