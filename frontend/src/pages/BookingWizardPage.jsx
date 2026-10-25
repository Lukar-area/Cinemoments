import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { ScreenMockupPreview } from '../components/ScreenMockupPreview.js';
import { Sparkles, Building2, Clock, Upload, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Calendar, Phone, Check, } from 'lucide-react';
export const BookingWizardPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    // Wizard Steps (1 through 8)
    const [step, setStep] = useState(1);
    // Loaded Data
    const [theatres, setTheatres] = useState([]);
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    // Form State
    const [selectedTheatreId, setSelectedTheatreId] = useState(null);
    const [selectedShowId, setSelectedShowId] = useState(null);
    const [bookingType, setBookingType] = useState('MARRIAGE_PROPOSAL');
    const [message, setMessage] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
    const [mediaType, setMediaType] = useState(null);
    // Submission State
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    // Load Initial Theatres and Shows
    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                const [theatresRes, showsRes] = await Promise.all([
                    api.theatres.getAll(),
                    api.shows.getShows(),
                ]);
                setTheatres(theatresRes.theatres);
                setShows(showsRes.shows);
                // Pre-select show or category from query params
                const queryShowId = searchParams.get('showId');
                if (queryShowId) {
                    const targetShowId = parseInt(queryShowId, 10);
                    const matchedShow = showsRes.shows.find((s) => s.id === targetShowId);
                    if (matchedShow) {
                        setSelectedTheatreId(matchedShow.theatre_id || null);
                        setSelectedShowId(targetShowId);
                        setStep(4); // Advance directly to booking purpose
                    }
                }
                const queryCategory = searchParams.get('category');
                if (queryCategory) {
                    setBookingType(queryCategory);
                }
            }
            catch (err) {
                console.error('Failed to initialize booking wizard:', err);
            }
            finally {
                setLoading(false);
            }
        }
        init();
    }, [searchParams]);
    // Selected Objects
    const selectedTheatre = theatres.find((t) => t.id === selectedTheatreId);
    const selectedShow = shows.find((s) => s.id === selectedShowId);
    // Filter shows based on selected theatre
    const availableShowsForTheatre = shows.filter((s) => s.theatre_id === selectedTheatreId && !s.is_interval_booked);
    // Media file selection and preview handler
    const handleMediaUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Check size limit (25MB)
        if (file.size > 25 * 1024 * 1024) {
            setErrorMessage('The file exceeds the 25MB maximum upload limit.');
            return;
        }
        setErrorMessage(null);
        setMediaFile(file);
        const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
        setMediaType(isVideo ? 'VIDEO' : 'IMAGE');
        const preview = URL.createObjectURL(file);
        setMediaPreviewUrl(preview);
    };
    const handleNext = () => {
        setErrorMessage(null);
        if (step === 1 && !selectedTheatreId) {
            setErrorMessage('Please select a theatre to proceed.');
            return;
        }
        if (step === 2 && !selectedShowId) {
            setErrorMessage('Please select a movie showtime to proceed.');
            return;
        }
        if (step === 5 && (!message || message.trim().length < 5)) {
            setErrorMessage('Please enter your interval message (minimum 5 characters).');
            return;
        }
        setStep((prev) => Math.min(prev + 1, 8));
    };
    const handleBack = () => {
        setErrorMessage(null);
        setStep((prev) => Math.max(prev - 1, 1));
    };
    const handleSubmit = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (!selectedShowId || !message) {
            setErrorMessage('Please fill in all required fields before submitting.');
            return;
        }
        try {
            setSubmitting(true);
            setErrorMessage(null);
            const formData = new FormData();
            formData.append('showId', selectedShowId.toString());
            formData.append('bookingType', bookingType);
            formData.append('message', message.trim());
            if (contactPhone)
                formData.append('contactPhone', contactPhone.trim());
            if (mediaFile)
                formData.append('media', mediaFile);
            await api.bookings.create(formData);
            await refreshUser?.();
            navigate('/dashboard?success=1');
        }
        catch (err) {
            setErrorMessage(err.message || 'Failed to submit booking request.');
        }
        finally {
            setSubmitting(false);
        }
    };
    const bookingCategories = [
        {
            id: 'MARRIAGE_PROPOSAL',
            label: 'Marriage Proposal',
            icon: '💍',
            desc: 'Will you marry me? Unforgettable big-screen proposal with theatre audience cheering.',
        },
        {
            id: 'LOVE_PROPOSAL',
            label: 'Love Proposal',
            icon: '❤️',
            desc: 'Confess your feelings or celebrate romantic milestones with personalized photos.',
        },
        {
            id: 'BIRTHDAY',
            label: 'Birthday Wishes',
            icon: '🎂',
            desc: 'Celebrate birthdays with vibrant pictures and hearty cheers.',
        },
        {
            id: 'ADVERTISEMENT',
            label: 'Commercial Advertisement',
            icon: '📢',
            desc: 'Promote your brand, company, or store directly to cinema attendees.',
        },
        {
            id: 'ANNIVERSARY',
            label: 'Anniversary Celebration',
            icon: '🥂',
            desc: 'Celebrate wedding or company anniversaries in silver-screen fashion.',
        },
        {
            id: 'PROMOTION',
            label: 'College / Event Promotion',
            icon: '🏢',
            desc: 'Broadcast upcoming campus events, competitions, concerts, and tech fests.',
        },
        {
            id: 'EVENT',
            label: 'Special Event',
            icon: '🎉',
            desc: 'Announcements for family reunions, film festivals, and community celebrations.',
        },
        {
            id: 'CUSTOM',
            label: 'Custom Surprise Message',
            icon: '🎁',
            desc: 'Personalized congratulations, gratitude notes, or unique surprises.',
        },
    ];
    return (<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Wizard Header */}
      <div className="text-center space-y-2">
        <span className="text-xs text-amber-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5"/>
          Interval Booking Studio
        </span>
        <h1 className="font-cinema text-3xl sm:text-4xl font-black text-white">
          Create Your Moment
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Follow our 8-step guided booking wizard to curate your cinema interval display.
        </p>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="p-4 rounded-2xl bg-cinema-850 border border-cinema-700/80 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span className="text-amber-400">
            Step {step} of 8:{' '}
            {[
            'Select Theatre',
            'Select Movie & Show',
            'Select Interval Slot',
            'Select Booking Purpose',
            'Compose Message',
            'Upload Media',
            'Big Screen Preview',
            'Final Confirmation',
        ][step - 1]}
          </span>
          <span>{Math.round((step / 8) * 100)}% Completed</span>
        </div>
        <div className="w-full h-2 rounded-full bg-cinema-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cinema-gold to-amber-400 rounded-full transition-all duration-300" style={{ width: `${(step / 8) * 100}%` }}/>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0"/>
          <span>{errorMessage}</span>
        </div>)}

      {/* Step Content Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-cinema-850 border border-cinema-700/80 shadow-2xl min-h-[420px]">
        {/* STEP 1: Select Theatre */}
        {step === 1 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Step 1: Choose Your Cinema Theatre</h2>
              <p className="text-xs text-slate-400 mt-1">
                Select where you want your intermission content screened.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {theatres.map((t) => (<div key={t.id} onClick={() => setSelectedTheatreId(t.id)} className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${selectedTheatreId === t.id
                    ? 'bg-amber-500/10 border-amber-400 shadow-glow-gold'
                    : 'bg-cinema-900/80 border-cinema-700/80 hover:border-slate-500'}`}>
                  <div>
                    <img src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80'} alt={t.name} className="w-full h-32 object-cover rounded-xl mb-3"/>
                    <h3 className="font-bold text-white text-base leading-snug">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0"/>
                      {t.city} • {t.location}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-cinema-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{t.screen_count || 2} Screens</span>
                      {selectedTheatreId === t.id && (<span className="text-amber-400 font-bold flex items-center gap-1">
                          <Check className="w-4 h-4"/> Selected
                        </span>)}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTheatreId(t.id);
                        setErrorMessage(null);
                        setStep(2);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        selectedTheatreId === t.id
                          ? 'bg-gradient-to-r from-cinema-gold to-amber-400 text-cinema-950 shadow-md'
                          : 'bg-cinema-800 hover:bg-amber-500 hover:text-cinema-950 text-amber-400 border border-cinema-700 hover:border-transparent'
                      }`}
                    >
                      {selectedTheatreId === t.id ? 'Continue to Shows →' : 'Select Theatre'}
                    </button>
                  </div>
                </div>))}
            </div>
          </div>)}

        {/* STEP 2: Select Movie and Show */}
        {step === 2 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Step 2: Select Movie & Show</h2>
              <p className="text-xs text-slate-400 mt-1">
                Showing available shows at{' '}
                <span className="text-amber-400 font-semibold">{selectedTheatre?.name}</span>.
              </p>
            </div>

            {availableShowsForTheatre.length === 0 ? (<div className="text-center py-12 text-slate-400">
                No shows available at this theatre. Please choose another cinema.
              </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableShowsForTheatre.map((show) => (<div key={show.id} onClick={() => setSelectedShowId(show.id)} className={`cursor-pointer p-4 rounded-2xl border transition-all flex gap-4 items-center ${selectedShowId === show.id
                        ? 'bg-amber-500/10 border-amber-400 shadow-glow-gold'
                        : 'bg-cinema-900/80 border-cinema-700/80 hover:border-slate-500'}`}>
                    <img src={show.movie_poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'} alt={show.movie_title} className="w-16 h-24 object-cover rounded-xl shrink-0"/>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-white text-sm line-clamp-1">
                        {show.movie_title}
                      </h4>
                      <p className="text-xs text-amber-400 font-medium">{show.screen_name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400"/>
                        {show.show_date} • {show.start_time}
                      </p>
                      <p className="text-[11px] text-emerald-400 font-medium">
                        Interval: {show.interval_start} - {show.interval_end}
                      </p>
                    </div>
                  </div>))}
              </div>)}
          </div>)}

        {/* STEP 3: Select Interval Slot */}
        {step === 3 && selectedShow && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Step 3: Interval Intermission Slot</h2>
              <p className="text-xs text-slate-400 mt-1">
                Review your interval intermission slot details.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cinema-900 border border-cinema-700/80 space-y-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-cinema-800">
                <span className="text-sm text-slate-400">Cinema & Screen:</span>
                <span className="text-sm font-bold text-white">
                  {selectedTheatre?.name} — {selectedShow.screen_name}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-cinema-800">
                <span className="text-sm text-slate-400">Movie Title:</span>
                <span className="text-sm font-bold text-amber-400">{selectedShow.movie_title}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-cinema-800">
                <span className="text-sm text-slate-400">Show Date & Time:</span>
                <span className="text-sm font-bold text-white">
                  {selectedShow.show_date} at {selectedShow.start_time}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-cinema-800 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <span className="text-sm text-amber-300 font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4"/>
                  Designated Interval Window:
                </span>
                <span className="text-base font-black text-amber-400">
                  {selectedShow.interval_start} – {selectedShow.interval_end}
                </span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pt-2">
                💡 Multiple guests may submit requests for this slot. Theatre staff reviews incoming
                requests and accepts exactly one; competing pending requests will automatically expire.
              </div>
            </div>
          </div>)}

        {/* STEP 4: Select Booking Purpose / Category */}
        {step === 4 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Step 4: Select Booking Purpose</h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose the occasion so the cinema team formats the presentation appropriately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bookingCategories.map((c) => (<div key={c.id} onClick={() => setBookingType(c.id)} className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${bookingType === c.id
                    ? 'bg-amber-500/15 border-amber-400 shadow-glow-gold'
                    : 'bg-cinema-900/80 border-cinema-700/80 hover:border-slate-500'}`}>
                  <div>
                    <span className="text-3xl block mb-2">{c.icon}</span>
                    <h3 className="font-bold text-white text-sm">{c.label}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.desc}</p>
                  </div>
                  {bookingType === c.id && (<span className="mt-3 text-xs text-amber-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5"/> Selected
                    </span>)}
                </div>))}
            </div>
          </div>)}

        {/* STEP 5: Enter Message & Contact Info */}
        {step === 5 && (<div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-white">Step 5: Enter Your Message</h2>
              <p className="text-xs text-slate-400 mt-1">
                This message will be prominently showcased on the giant auditorium screen.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Big Screen Message (Required)</span>
                  <span className="text-slate-500">{message.length}/250 characters</span>
                </label>
                <textarea rows={4} maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Will you marry me, Pooja? You make my world magical every day! ❤️" className="w-full px-4 py-3 rounded-xl bg-cinema-900 border border-cinema-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 text-sm leading-relaxed"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Contact Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 (555) 012-3456" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-900 border border-cinema-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Allows theatre staff to coordinate cues or timing if necessary.
                </p>
              </div>
            </div>
          </div>)}

        {/* STEP 6: Upload Media */}
        {step === 6 && (<div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-white">Step 6: Upload Media (Optional)</h2>
              <p className="text-xs text-slate-400 mt-1">
                Upload a photograph or video to accompany your message. Files are encrypted with
                AES-256-GCM.
              </p>
            </div>

            <div className="border-2 border-dashed border-cinema-700 hover:border-amber-400 rounded-3xl p-8 text-center transition-colors bg-cinema-900/60 relative">
              <input type="file" accept=".jpg,.jpeg,.png,.mp4,.webm" onChange={handleMediaUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
              <Upload className="w-10 h-10 text-amber-400 mx-auto mb-3"/>
              <h4 className="text-sm font-bold text-white">Click or drag & drop media file</h4>
              <p className="text-xs text-slate-400 mt-1">Supported: JPG, PNG, MP4, WebM (Max 25MB)</p>

              {mediaFile && (<div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4"/>
                  {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>)}
            </div>

            {mediaPreviewUrl && (<div className="p-4 rounded-2xl bg-cinema-900 border border-cinema-800 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Media Preview:</span>
                {mediaType === 'IMAGE' ? (<img src={mediaPreviewUrl} alt="Upload Preview" className="max-h-48 rounded-xl object-contain mx-auto"/>) : (<video src={mediaPreviewUrl} controls className="max-h-48 rounded-xl bg-black mx-auto"/>)}
              </div>)}
          </div>)}

        {/* STEP 7: Cinema Screen Mockup Preview */}
        {step === 7 && (<div className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-white">Step 7: Live Cinema Big-Screen Preview</h2>
              <p className="text-xs text-slate-400 mt-1">
                This simulation illustrates how your proposal will appear on the auditorium screen
                during the interval intermission.
              </p>
            </div>

            <ScreenMockupPreview message={message} bookingType={bookingType} mediaPreviewUrl={mediaPreviewUrl} mediaType={mediaType} movieTitle={selectedShow?.movie_title} theatreName={selectedTheatre?.name}/>
          </div>)}

        {/* STEP 8: Final Confirmation */}
        {step === 8 && (<div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-white">Step 8: Final Booking Confirmation</h2>
              <p className="text-xs text-slate-400 mt-1">
                Please review your interval booking request before final submission.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-cinema-900 border border-cinema-700 space-y-4 text-sm">
              <div className="flex justify-between pb-3 border-b border-cinema-800">
                <span className="text-slate-400">Theatre:</span>
                <span className="font-bold text-white">{selectedTheatre?.name}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-cinema-800">
                <span className="text-slate-400">Movie & Screen:</span>
                <span className="font-bold text-white">
                  {selectedShow?.movie_title} ({selectedShow?.screen_name})
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-cinema-800">
                <span className="text-slate-400">Date & Showtime:</span>
                <span className="font-bold text-white">
                  {selectedShow?.show_date} • {selectedShow?.start_time}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-cinema-800 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <span className="text-amber-300 font-semibold">Interval Window:</span>
                <span className="font-bold text-amber-400">
                  {selectedShow?.interval_start} – {selectedShow?.interval_end}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-cinema-800">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-white capitalize">
                  {bookingType.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-1 pb-3 border-b border-cinema-800">
                <span className="text-slate-400 block">Screen Message:</span>
                <p className="p-3 rounded-xl bg-cinema-950 text-amber-200 font-medium italic border border-cinema-800">
                  "{message}"
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Encrypted Media:</span>
                <span className="font-semibold text-white">
                  {mediaFile ? `Attached (${mediaFile.name})` : 'Text only (no file attached)'}
                </span>
              </div>
            </div>

            {/* Wallet & Escrow Summary */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider block">
                💳 Wallet Billing & Escrow Summary
              </span>
              <div className="flex justify-between text-slate-300">
                <span>Interval Screening Fee:</span>
                <span className="font-bold text-white">₹{Number(selectedShow?.price_estimate || 500).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Current Wallet Balance:</span>
                <span className="font-bold text-white">₹{Number(user?.wallet_balance ?? 2000).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-amber-500/20 pt-2 text-amber-300 font-bold">
                <span>Remaining Balance after Booking:</span>
                <span>
                  ₹{(Number(user?.wallet_balance ?? 2000) - Number(selectedShow?.price_estimate || 500)).toFixed(2)}
                </span>
              </div>
              {Number(user?.wallet_balance ?? 2000) < Number(selectedShow?.price_estimate || 500) && (
                <p className="text-red-400 font-bold pt-1">
                  ⚠️ Insufficient wallet balance to complete this booking.
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-cinema-800 text-xs text-slate-300 leading-relaxed border border-cinema-700">
              🛡️ Upon submission, your request enters <strong className="text-amber-400">PENDING</strong>{' '}
              status. The theatre staff will review your content. If rejected or cancelled,
              funds are 100% refunded immediately to your wallet.
            </div>
          </div>)}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        {step > 1 ? (<button type="button" onClick={handleBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cinema-800 hover:bg-cinema-750 text-slate-300 hover:text-white text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>) : (<div />)}

        {step < 8 ? (<button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cinema-gold to-amber-400 hover:from-amber-400 hover:to-cinema-gold text-cinema-950 text-sm font-bold shadow-md shadow-cinema-gold/20 transition-all">
            Continue <ArrowRight className="w-4 h-4"/>
          </button>) : (<button type="button" onClick={handleSubmit} disabled={submitting || (Number(user?.wallet_balance ?? 2000) < Number(selectedShow?.price_estimate || 500))} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50">
            {submitting ? 'Submitting Request...' : 'Confirm & Submit Booking Request'}
          </button>)}
      </div>
    </div>);
};
