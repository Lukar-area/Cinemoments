import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Film, Lock, Mail, User, Phone, AlertCircle, Sparkles } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.auth.register({
        name,
        email,
        phone,
        password,
        role,
      });
      login(res.token, res.user);
      if (res.user.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#9F2B68]/5 blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Theatrical Marquee Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] flex items-center justify-center mx-auto shadow-xl shadow-[#9F2B68]/25 border border-white/20">
            <Film className="w-7 h-7 text-white" />
          </div>
          <span className="block text-[10px] font-mono font-bold tracking-[0.25em] text-[#9F2B68] uppercase">
            MEMBERSHIP ENROLLMENT
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934]">
            Create VIP Account
          </h1>
          <p className="text-xs text-[#483248] font-medium">
            Join CineMoments to direct unforgettable movie intervals on the silver screen
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
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Verma"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

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
                  placeholder="rahul@cinema.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                Phone Number (For SMS Dispatch)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                Account Designation
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    role === 'CUSTOMER'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-sm'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  Audience / Director
                </button>
                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`p-3 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    role === 'STAFF'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-sm'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  Theatre Staff
                </button>
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
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-cinema-shimmer w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:opacity-95 text-white font-mono font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#9F2B68]/25 transition-all duration-150 disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Registering VIP Pass...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#483248]">
          Already enrolled?{' '}
          <Link to="/login" className="text-[#9F2B68] font-bold hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};
