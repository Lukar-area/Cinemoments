import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import { Film, Bell, User as UserIcon, LogOut, Sparkles, Menu, X, CheckCheck, ShieldCheck, Ticket, } from 'lucide-react';
export const Navbar = () => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const [showNotifs, setShowNotifs] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const notifRef = useRef(null);
    const userMenuRef = useRef(null);
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
    return (<nav className="sticky top-0 z-50 bg-cinema-950/90 backdrop-blur-md border-b border-cinema-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cinema-red via-cinema-gold to-amber-600 flex items-center justify-center shadow-lg shadow-cinema-red/20 group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5 text-white"/>
            </div>
            <div>
              <span className="font-cinema text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-white">
                CINEMOMENTS
              </span>
              <span className="block text-[10px] text-amber-500/80 uppercase tracking-widest font-semibold">
                Big Screen Moments
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link to="/theatres" className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/theatres')
            ? 'text-cinema-gold bg-cinema-800'
            : 'text-slate-300 hover:text-white hover:bg-cinema-850'}`}>
              Theatres
            </Link>
            <Link to="/movies" className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/movies')
            ? 'text-cinema-gold bg-cinema-800'
            : 'text-slate-300 hover:text-white hover:bg-cinema-850'}`}>
              Movies
            </Link>
            <Link to="/book" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-cinema-950 bg-gradient-to-r from-cinema-gold to-amber-400 hover:from-amber-400 hover:to-cinema-gold shadow-md shadow-cinema-gold/20 hover:shadow-glow-gold transition-all duration-200">
              <Sparkles className="w-4 h-4"/>
              Book an Interval
            </Link>

            {user?.role === 'CUSTOMER' && (<Link to="/dashboard" className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard')
                ? 'text-cinema-gold bg-cinema-800'
                : 'text-slate-300 hover:text-white hover:bg-cinema-850'}`}>
                My Bookings
              </Link>)}

            {user?.role === 'STAFF' && (<Link to="/staff" className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/staff')
                ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-cinema-850'}`}>
                <Ticket className="w-4 h-4 text-amber-400"/>
                Theatre Dashboard
              </Link>)}

            {user?.role === 'ADMIN' && (<Link to="/admin" className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin')
                ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30'
                : 'text-slate-300 hover:text-white hover:bg-cinema-850'}`}>
                <ShieldCheck className="w-4 h-4 text-purple-400"/>
                Admin Panel
              </Link>)}
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Wallet Balance Badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300">
                <span className="text-amber-400">💳</span>
                <span>₹{Number(user.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Notification Bell (Logged in only) */}
            {user && (<div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2.5 rounded-xl bg-cinema-850 hover:bg-cinema-800 text-slate-300 hover:text-white border border-cinema-700/60 transition-colors" aria-label="Notifications">
                  <Bell className="w-5 h-5"/>
                  {unreadCount > 0 && (<span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-cinema-red text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md animate-bounce">
                      {unreadCount}
                    </span>)}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (<div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-cinema-850 border border-cinema-700 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-cinema-700 flex items-center justify-between bg-cinema-900/60">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-cinema-gold"/>
                        <span className="font-semibold text-sm text-slate-100">Notifications</span>
                        {unreadCount > 0 && (<span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full font-medium">
                            {unreadCount} new
                          </span>)}
                      </div>
                      {unreadCount > 0 && (<button onClick={markAllAsRead} className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1">
                          <CheckCheck className="w-3.5 h-3.5"/>
                          Mark all read
                        </button>)}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-cinema-700/40">
                      {notifications.length === 0 ? (<div className="py-8 text-center text-slate-400 text-sm">
                          No notifications yet.
                        </div>) : (notifications.map((notif) => (<div key={notif.id} onClick={() => {
                        if (!notif.is_read)
                            markAsRead(notif.id);
                        if (user.role === 'CUSTOMER')
                            navigate('/dashboard');
                        if (user.role === 'STAFF')
                            navigate('/staff');
                        setShowNotifs(false);
                    }} className={`p-3.5 transition-colors cursor-pointer hover:bg-cinema-800/60 ${!notif.is_read ? 'bg-amber-500/5' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
                                {notif.title}
                              </h4>
                              {!notif.is_read && (<span className="w-2 h-2 rounded-full bg-cinema-gold shrink-0 mt-1"/>)}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-500 mt-2 block">
                              {new Date(notif.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}{' '}
                              • {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>)))}
                    </div>
                  </div>)}
              </div>)}

            {/* User Profile / Auth State */}
            {user ? (<div className="relative" ref={userMenuRef}>
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-2 rounded-xl bg-cinema-850 hover:bg-cinema-800 border border-cinema-700/60 text-slate-200 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-cinema-gold flex items-center justify-center text-black font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <span className="block text-xs font-semibold leading-tight">{user.name}</span>
                    <span className="block text-[10px] text-amber-400 font-medium capitalize">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                </button>

                {/* User Dropdown */}
                {showUserMenu && (<div className="absolute right-0 mt-3 w-56 rounded-2xl bg-cinema-850 border border-cinema-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-cinema-700/60 mb-1">
                      <p className="text-xs text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    </div>

                    {user.role === 'CUSTOMER' && (<Link to="/dashboard" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-cinema-800 rounded-lg transition-colors">
                        <UserIcon className="w-4 h-4 text-cinema-gold"/>
                        My Dashboard
                      </Link>)}

                    {user.role === 'STAFF' && (<Link to="/staff" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-cinema-800 rounded-lg transition-colors">
                        <Ticket className="w-4 h-4 text-amber-400"/>
                        Theatre Dashboard
                      </Link>)}

                    {user.role === 'ADMIN' && (<Link to="/admin" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-cinema-800 rounded-lg transition-colors">
                        <ShieldCheck className="w-4 h-4 text-purple-400"/>
                        Admin Dashboard
                      </Link>)}

                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-left mt-1">
                      <LogOut className="w-4 h-4"/>
                      Sign Out
                    </button>
                  </div>)}
              </div>) : (<div className="flex items-center gap-2">
                <Link to="/login" className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Log In
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold rounded-lg bg-cinema-800 hover:bg-cinema-700 text-white border border-cinema-600 transition-colors shadow-sm">
                  Register
                </Link>
              </div>)}

            {/* Mobile Hamburger Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg bg-cinema-850 text-slate-400 hover:text-white">
              {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (<div className="md:hidden px-4 pt-2 pb-6 border-b border-cinema-700 bg-cinema-950 space-y-2">
          <Link to="/theatres" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-cinema-800 font-medium">
            Theatres
          </Link>
          <Link to="/movies" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-cinema-800 font-medium">
            Movies
          </Link>
          <Link to="/book" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-cinema-950 bg-cinema-gold font-semibold">
            Book an Interval
          </Link>

          {user?.role === 'CUSTOMER' && (<Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-slate-300 hover:bg-cinema-800 font-medium">
              My Dashboard
            </Link>)}

          {user?.role === 'STAFF' && (<Link to="/staff" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-amber-400 hover:bg-cinema-800 font-medium">
              Theatre Dashboard
            </Link>)}

          {user?.role === 'ADMIN' && (<Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-purple-400 hover:bg-cinema-800 font-medium">
              Admin Panel
            </Link>)}
        </div>)}
    </nav>);
};
