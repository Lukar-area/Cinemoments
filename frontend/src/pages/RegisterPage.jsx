import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { Film, Lock, Mail, User, Phone, AlertCircle } from 'lucide-react';
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
            }
            else {
                navigate('/dashboard');
            }
        }
        catch (err) {
            setError(err.message || 'Registration failed.');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cinema-red to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-cinema-red/20">
            <Film className="w-6 h-6 text-white"/>
          </div>
          <h1 className="font-cinema text-3xl font-black text-white">Create Account</h1>
          <p className="text-xs text-slate-400">
            Join CineMoments to book unforgettable movie intervals
          </p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl bg-cinema-850 border border-cinema-700/80 shadow-2xl space-y-6">
          {error && (<div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0"/>
              <span>{error}</span>
            </div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Verma" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
              </div>
            </div>

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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 012-3456" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole('CUSTOMER')} className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${role === 'CUSTOMER'
            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
            : 'bg-cinema-900 border-cinema-700 text-slate-400'}`}>
                  Customer
                </button>
                <button type="button" onClick={() => setRole('STAFF')} className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${role === 'STAFF'
            ? 'bg-amber-500/20 border-amber-400 text-amber-300'
            : 'bg-cinema-900 border-cinema-700 text-slate-400'}`}>
                  Theatre Staff
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-cinema-gold to-amber-400 hover:from-amber-400 hover:to-cinema-gold text-cinema-950 font-bold text-sm shadow-md shadow-cinema-gold/20 transition-all duration-150 disabled:opacity-50 mt-2">
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>);
};
