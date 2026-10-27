import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Film, Lock, Mail, AlertCircle, UserCheck, ShieldCheck, RotateCw } from 'lucide-react';
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
            setError('Please solve the 5-character security CAPTCHA.');
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
            }
            else if (res.user.role === 'ADMIN') {
                navigate('/admin');
            }
            else {
                navigate(from === '/login' ? '/dashboard' : from);
            }
        }
        catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
            fetchCaptcha();
        }
        finally {
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
            }
            else if (res.user.role === 'ADMIN') {
                navigate('/admin');
            }
            else {
                navigate(from === '/login' ? '/dashboard' : from);
            }
        }
        catch (err) {
            setError(err.message || 'Login failed.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cinema-red to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-cinema-red/20">
            <Film className="w-6 h-6 text-white"/>
          </div>
          <h1 className="font-cinema text-3xl font-black text-white">Sign In</h1>
          <p className="text-xs text-slate-400">Access your CineMoments interval booking account</p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-3xl bg-cinema-850 border border-cinema-700/80 shadow-2xl space-y-6">
          {error && (<div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
              </div>
            </div>

            {/* Visual CAPTCHA Verification */}
            <div className="p-3.5 rounded-2xl bg-cinema-900/90 border border-cinema-700 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400"/>
                  Security CAPTCHA Verification
                </label>
                <button
                  type="button"
                  onClick={fetchCaptcha}
                  disabled={loadingCaptcha}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-cinema-800 border border-cinema-700/60"
                  title="Generate new challenge"
                >
                  <RotateCw className={`w-3 h-3 ${loadingCaptcha ? 'animate-spin' : ''}`}/>
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 items-center">
                <div className="h-12 bg-cinema-950 border border-cinema-800 rounded-xl overflow-hidden flex items-center justify-center p-1 select-none shadow-inner">
                  {captchaSvg ? (
                    <img
                      src={captchaSvg}
                      alt="CAPTCHA Challenge"
                      className="h-full w-full object-contain pointer-events-none"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500">Generating code...</span>
                  )}
                </div>

                <input
                  type="text"
                  required
                  maxLength={5}
                  value={captchaSolution}
                  onChange={(e) => setCaptchaSolution(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="h-12 px-3 rounded-xl bg-cinema-950 border border-cinema-700 text-sm font-mono font-bold tracking-widest text-center text-amber-300 uppercase placeholder-slate-600 focus:outline-none focus:border-amber-400 shadow-inner"
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Enter the 5 characters displayed in the anti-bot visual challenge.
              </p>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-cinema-gold to-amber-400 hover:from-amber-400 hover:to-cinema-gold text-cinema-950 font-bold text-sm shadow-md shadow-cinema-gold/20 transition-all duration-150 disabled:opacity-50">
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <button type="button" onClick={handleGuestLogin} disabled={loading} className="w-full py-2.5 rounded-xl bg-cinema-900 hover:bg-cinema-800 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400"/>
              Continue as Guest (Instant ₹2,000 Wallet)
            </button>
          </form>

          {/* Quick Demo Autofill Section */}
          <div className="pt-4 border-t border-cinema-700/60 space-y-2.5">
            <span className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider text-center">
              ⚡ Quick Demo 1-Click Login
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => handleQuickLogin('rahul@example.com')} className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 text-[11px] text-slate-300 hover:text-white border border-cinema-750 font-medium text-center transition-colors">
                Customer
              </button>
              <button type="button" onClick={() => handleQuickLogin('staff@grandcinema.com')} className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 text-[11px] text-amber-400 hover:text-amber-300 border border-amber-500/20 font-medium text-center transition-colors">
                Theatre Staff
              </button>
              <button type="button" onClick={() => handleQuickLogin('admin@cinemoments.com')} className="p-2 rounded-lg bg-cinema-900 hover:bg-cinema-800 text-[11px] text-purple-400 hover:text-purple-300 border border-purple-500/20 font-medium text-center transition-colors">
                Admin
              </button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Password for all demo accounts: <code>Password123!</code>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-amber-400 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>);
};
