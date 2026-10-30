import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Film,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  Building2,
  MapPin,
  Compass,
  PhoneCall,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Staff Account Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');

  // Theatre Details (required when role === 'STAFF')
  const [theatreName, setTheatreName] = useState('');
  const [theatreLocation, setTheatreLocation] = useState('');
  const [theatreAddress, setTheatreAddress] = useState('');
  const [city, setCity] = useState('');
  const [theatrePhone, setTheatrePhone] = useState('');
  const [theatreEmail, setTheatreEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Staff credentials validation
    if (!name.trim() || !email.trim() || !password) {
      setError('Staff full name, email, and password are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid staff email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirm password.');
      return;
    }

    // Theatre details validation for STAFF
    if (role === 'STAFF') {
      if (!phone.trim()) {
        setError('Staff contact phone number is required.');
        return;
      }
      if (
        !theatreName.trim() ||
        !theatreLocation.trim() ||
        !theatreAddress.trim() ||
        !city.trim() ||
        !theatrePhone.trim() ||
        !theatreEmail.trim()
      ) {
        setError(
          'All theatre details (Theatre Name, Location, Address, City, Contact Number, and Email Address) are required for Staff Registration.'
        );
        return;
      }

      if (!emailRegex.test(theatreEmail.trim())) {
        setError('Please provide a valid theatre contact email address.');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
        confirmPassword,
        role,
      };

      if (role === 'STAFF') {
        payload.theatreName = theatreName.trim();
        payload.theatreLocation = theatreLocation.trim();
        payload.theatreAddress = theatreAddress.trim();
        payload.city = city.trim();
        payload.theatrePhone = theatrePhone.trim();
        payload.theatreEmail = theatreEmail.trim().toLowerCase();
      }

      const res = await api.auth.register(payload);
      login(res.token, res.user);

      if (res.user.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#9F2B68]/5 blur-3xl pointer-events-none rounded-full" />

      <div className={`w-full ${role === 'STAFF' ? 'max-w-2xl' : 'max-w-md'} space-y-6 relative z-10 transition-all duration-300`}>
        {/* Theatrical Marquee Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] flex items-center justify-center mx-auto shadow-xl shadow-[#9F2B68]/25 border border-white/20">
            <Film className="w-7 h-7 text-white" />
          </div>
          <span className="block text-[10px] font-mono font-bold tracking-[0.25em] text-[#9F2B68] uppercase">
            {role === 'STAFF' ? 'THEATRE MANAGEMENT ONBOARDING' : 'MEMBERSHIP ENROLLMENT'}
          </span>
          <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934]">
            {role === 'STAFF' ? 'Register Theatre & Staff Account' : 'Create VIP Account'}
          </h1>
          <p className="text-xs text-[#483248] font-medium max-w-lg mx-auto">
            {role === 'STAFF'
              ? 'Enroll your cinema facility and staff credentials to manage interval proposals, playouts, and audio cues in 4K glory.'
              : 'Join CineMoments to direct unforgettable movie intervals on the silver screen'}
          </p>
        </div>

        {/* Marquee Card Frame */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-xl space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 text-xs text-[#800020] flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#800020]" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Designation Selector */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-2">
                Account Designation
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRole('CUSTOMER');
                    setError(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    role === 'CUSTOMER'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-md shadow-[#9F2B68]/15'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  <span className="block font-bold">Audience / Director</span>
                  <span className="text-[10px] text-[#AA98A9] font-normal normal-case block mt-0.5">Book interval screenings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRole('STAFF');
                    setError(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                    role === 'STAFF'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-md shadow-[#9F2B68]/15'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  <span className="block font-bold">Theatre Staff</span>
                  <span className="text-[10px] text-[#AA98A9] font-normal normal-case block mt-0.5">Manage cinema & playouts</span>
                </button>
              </div>
            </div>

            {/* Section 1: Staff Account Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#CBC3E3]">
                <User className="w-4 h-4 text-[#9F2B68]" />
                <h3 className="text-sm font-bold text-[#301934] font-cinema">
                  Staff Personal Credentials
                </h3>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                  Full Name <span className="text-[#9F2B68]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Email Address <span className="text-[#9F2B68]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ramesh@theatre.com"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Phone Number {role === 'STAFF' && <span className="text-[#9F2B68]">*</span>}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required={role === 'STAFF'}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Password <span className="text-[#9F2B68]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Confirm Password <span className="text-[#9F2B68]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Theatre Information (Staff Only) */}
            {role === 'STAFF' && (
              <div className="space-y-4 pt-4 border-t-2 border-[#E6E6FA] animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#CBC3E3]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#9F2B68]" />
                    <h3 className="text-sm font-bold text-[#301934] font-cinema">
                      Theatre Information & Facility Details
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#9F2B68] font-mono font-semibold uppercase bg-[#FFF0F7] px-2 py-0.5 rounded-md border border-[#9F2B68]/30">
                    Facility Linking
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs text-[#5E435E] leading-relaxed">
                  💡 If your cinema facility is already registered on CineMoments with matching name and address, your account will safely link to it. Otherwise, a new cinema profile will be created with you as administrator.
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Theatre Name <span className="text-[#9F2B68]">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required={role === 'STAFF'}
                      value={theatreName}
                      onChange={(e) => setTheatreName(e.target.value)}
                      placeholder="e.g. Chennai Royal Cinemas"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Theatre Location / Area <span className="text-[#9F2B68]">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required={role === 'STAFF'}
                        value={theatreLocation}
                        onChange={(e) => setTheatreLocation(e.target.value)}
                        placeholder="e.g. T. Nagar"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      City <span className="text-[#9F2B68]">*</span>
                    </label>
                    <div className="relative">
                      <Compass className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required={role === 'STAFF'}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Chennai"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                    Theatre Physical Address <span className="text-[#9F2B68]">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      required={role === 'STAFF'}
                      value={theatreAddress}
                      onChange={(e) => setTheatreAddress(e.target.value)}
                      placeholder="e.g. 12 Usman Road, Near Panagal Park"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Theatre Contact Number <span className="text-[#9F2B68]">*</span>
                    </label>
                    <div className="relative">
                      <PhoneCall className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required={role === 'STAFF'}
                        value={theatrePhone}
                        onChange={(e) => setTheatrePhone(e.target.value)}
                        placeholder="e.g. +91 44 2434 5678"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#301934] mb-1.5">
                      Theatre Official Email <span className="text-[#9F2B68]">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required={role === 'STAFF'}
                        value={theatreEmail}
                        onChange={(e) => setTheatreEmail(e.target.value)}
                        placeholder="e.g. contact@chennairoyal.com"
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-cinema-shimmer w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:opacity-95 text-white font-mono font-bold text-xs uppercase tracking-widest shadow-xl shadow-[#9F2B68]/25 transition-all duration-150 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading
                ? role === 'STAFF'
                  ? 'Configuring Theatre & Staff Account...'
                  : 'Registering VIP Pass...'
                : role === 'STAFF'
                ? 'Register & Access Theatre Dashboard'
                : 'Create Account'}
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
