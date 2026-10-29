import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Film, Lock, Mail, AlertCircle, UserCheck, ShieldCheck, RotateCw, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaSolution, setCaptchaSolution] = useState('');
  const [loadingCaptcha, setLoadingCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const from = location.state?.from?.pathname || '/dashboard';

  const fetchCaptcha = async () => {
    try {
      setLoadingCaptcha(true);
      const res = await api.auth.getCaptcha();
      if (res.success) {
        setCaptchaSvg(res.captchaSvg);
        setCaptchaToken(res.captchaToken);
        setCaptchaSolution('');
      }
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
    } finally {
      setLoadingCaptcha(false);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }
    if (!captchaSolution.trim()) {
      setError('Please solve the 5-character security CAPTCHA challenge.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.auth.login({
        email,
        password,
        captchaToken,
        captchaSolution: captchaSolution.trim().toUpperCase(),
      });
      login(res.token, res.user);
      if (res.user.role === 'STAFF') {
        navigate('/staff');
      } else if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from === '/login' ? '/dashboard' : from);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.auth.guest();
      login(res.token, res.user);
      navigate(from === '/login' ? '/dashboard' : from);
    } catch (err) {
      setError(err.message || 'Failed to initialize guest session.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    try {
      setLoading(true);
      setError(null);
      const res = await api.auth.login({ email: demoEmail, password: 'Password123!' });
      login(res.token, res.user);
      if (res.user.role === 'STAFF') {
        navigate('/staff');
      } else if (res.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from === '/login' ? '/dashboard' : from);
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      {/* Background Projector Light Accent */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#9F2B68]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Theatrical Marquee Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] flex items-center justify-center mx-auto shadow-xl shadow-[#9F2B68]/25 border border-white/20">
            <Film className="w-7 h-7 text-white" />
          </div>
          <span className="block text-[10px] font-mono font-bold tracking-[0.25em] text-[#9F2B68] uppercase">
            AUDITORIUM ACCESS
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934]">
            Director Sign In
          </h1>
          <p className="text-xs text-[#483248] font-medium">
            Access your CineMoments account to manage interval bookings & tickets
          </p>
        </div>

        {/* Marquee Card Frame */}
        <div className="p-8 rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 text-xs text-[#800020] flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#800020]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cinema.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

            {/* Anti-Bot Visual CAPTCHA */}
            <div className="p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#301934] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#9F2B68]" />
                  Security CAPTCHA Challenge
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={loadingCaptcha}
                  className="text-[10px] font-mono text-[#9F2B68] hover:text-[#BF40BF] flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-white border border-[#CBC3E3] cursor-pointer"
                  title="Generate new challenge"
                >
                  <RotateCw className={`w-3 h-3 ${loadingCaptcha ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 items-center">
                <div className="h-12 bg-white border border-[#CBC3E3] rounded-xl overflow-hidden flex items-center justify-center p-1 select-none shadow-inner">
                  {captchaSvg ? (
                    <img
                      src={captchaSvg}
                      alt="CAPTCHA Challenge"
                      className="h-full w-full object-contain pointer-events-none"
                    />
                  ) : (
                    <span className="text-xs font-mono text-[#AA98A9]">Generating...</span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={captchaSolution}
                  onChange={(e) => setCaptchaSolution(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="h-12 px-3 rounded-xl bg-white border border-[#CBC3E3] text-sm font-mono font-bold tracking-widest text-center text-[#9F2B68] uppercase placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] shadow-inner"
                />
              </div>
              <p className="text-[10px] text-[#AA98A9] font-mono">
                Enter the 5 characters displayed in the anti-bot verification.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cinema-shimmer w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:opacity-95 text-white font-mono font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#9F2B68]/25 transition-all duration-150 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In To Auditorium'}
            </button>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-[#E6E6FA] hover:bg-[#CBC3E3] text-[#702963] border border-[#CBC3E3] font-mono font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-[#9F2B68]" />
              Continue as Guest (Instant ₹2,000 Wallet)
            </button>
          </form>

          {/* Quick Demo Autofill Section */}
          <div className="pt-4 border-t border-[#CBC3E3] space-y-2.5">
            <span className="block text-[10px] font-mono font-bold text-[#9F2B68] uppercase tracking-widest text-center">
              ⚡ 1-Click Role Direct Access
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('rahul@example.com')}
                className="p-2.5 rounded-xl bg-white border border-[#CBC3E3] hover:border-[#9F2B68] text-[11px] font-mono text-[#301934] text-center transition-all cursor-pointer shadow-sm"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff@grandcinema.com')}
                className="p-2.5 rounded-xl bg-[#FFF0F7] border border-[#9F2B68]/30 hover:border-[#9F2B68] text-[11px] font-mono text-[#9F2B68] text-center transition-all cursor-pointer shadow-sm"
              >
                Theatre Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@cinemoments.com')}
                className="p-2.5 rounded-xl bg-[#F8F5FF] border border-[#5D3FD3]/30 hover:border-[#5D3FD3] text-[11px] font-mono text-[#5D3FD3] text-center transition-all cursor-pointer shadow-sm"
              >
                Admin
              </button>
            </div>
            <p className="text-[10px] text-[#AA98A9] text-center font-mono">
              Password for all roles: <code className="text-[#301934] font-bold">Password123!</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#483248]">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-[#9F2B68] font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};
