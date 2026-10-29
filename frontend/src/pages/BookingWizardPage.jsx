import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { ScreenMockupPreview } from '../components/ScreenMockupPreview.jsx';
import { ReceiptModal } from '../components/ReceiptModal.jsx';
import { WalletTopupModal } from '../components/WalletTopupModal.jsx';
import {
    Sparkles,
    Building2,
    Clock,
    Upload,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Calendar,
    Phone,
    Check,
    CreditCard,
    QrCode,
    ShieldCheck,
    Zap,
    Plus,
} from 'lucide-react';

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

    // Payment & Modal State
    const [paymentMethod, setPaymentMethod] = useState('WALLET'); // 'WALLET' | 'UPI' | 'CARD'
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [activeReceipt, setActiveReceipt] = useState(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

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

            let paymentId = `pay_${Date.now()}`;
            let orderId = `order_${Date.now()}`;

            // If paying via UPI or Card, process gateway verification
            if (paymentMethod !== 'WALLET') {
                const orderRes = await api.payments.createOrder({
                    amount: Number(selectedShow?.price_estimate || 500),
                    currency: 'INR',
                    showId: selectedShowId,
                    bookingType,
                });
                orderId = orderRes.order?.orderId || orderId;

                const verifyRes = await api.payments.verifyPayment({
                    orderId,
                    paymentId,
                    signature: 'sig_verified_mock_success',
                    paymentMethod,
                });
                paymentId = verifyRes.result?.paymentId || paymentId;
            }

            const formData = new FormData();
            formData.append('showId', selectedShowId.toString());
            formData.append('bookingType', bookingType);
            formData.append('message', message.trim());
            formData.append('paymentMethod', paymentMethod);
            formData.append('paymentId', paymentId);
            formData.append('orderId', orderId);
            if (contactPhone)
                formData.append('contactPhone', contactPhone.trim());
            if (mediaFile)
                formData.append('media', mediaFile);

            const res = await api.bookings.create(formData);
            await refreshUser?.();

            // Build digital receipt for immediate display
            const receipt = {
                receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
                date: new Date().toISOString(),
                customer: {
                    name: user.name,
                    email: user.email,
                    phone: contactPhone || user.phone,
                },
                theatre: {
                    name: selectedTheatre?.name,
                    address: selectedTheatre?.address,
                    city: selectedTheatre?.city,
                },
                booking: {
                    id: res.bookingId,
                    type: bookingType,
                    status: 'PENDING',
                    message: message.trim(),
                    movieTitle: selectedShow?.movie_title,
                    showDate: selectedShow?.show_date,
                    intervalSlot: `${selectedShow?.interval_start} - ${selectedShow?.interval_end}`,
                },
                payment: {
                    totalAmount: Number(selectedShow?.price_estimate || 500),
                    paymentMethod,
                    paymentId,
                    status: 'COMPLETED',
                },
            };

            setActiveReceipt(receipt);
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
        <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#9F2B68]"/>
          DIRECTOR'S PRODUCTION BOOTH
        </span>
        <h1 className="font-cinema text-3xl sm:text-4xl font-black text-[#301934]">
          Direct Your Big Screen Moment
        </h1>
        <p className="text-xs sm:text-sm text-[#483248] max-w-lg mx-auto font-medium">
          Follow our 8-scene production pipeline to curate your 4K laser cinema intermission showcase.
        </p>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="p-5 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-[#483248] mb-2.5">
          <span className="text-[#9F2B68]">
            SCENE {step} / 8:{' '}
            {[
            'SELECT AUDITORIUM',
            'CHOOSE MOVIE & SHOW',
            'LOCK INTERVAL WINDOW',
            'SELECT CELEBRATION THEME',
            'COMPOSE SCREEN MESSAGE',
            'UPLOAD MEDIA & 4K ASSETS',
            'AUDITORIUM STAGE PREVIEW',
            'PROJECTION LOCK & PAYMENT',
        ][step - 1]}
          </span>
          <span className="text-[#5D3FD3]">{Math.round((step / 8) * 100)}% COMPLETE</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#E6E6FA] overflow-hidden border border-[#CBC3E3]">
          <div className="h-full bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] rounded-full transition-all duration-500 shadow-sm" style={{ width: `${(step / 8) * 100}%` }}/>
        </div>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (<div className="p-4 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 flex items-center gap-3 text-[#800020] text-sm font-mono">
          <AlertCircle className="w-5 h-5 shrink-0"/>
          <span>{errorMessage}</span>
        </div>)}

      {/* Step Content Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#CBC3E3] shadow-md min-h-[420px]">
        {/* STEP 1: Select Theatre */}
        {step === 1 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#301934]">Step 1: Choose Your Cinema Theatre</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                Select where you want your intermission content screened.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {theatres.map((t) => (<div key={t.id} onClick={() => setSelectedTheatreId(t.id)} className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${selectedTheatreId === t.id
                    ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
                    : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'}`}>
                  <div>
                    <img src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80'} alt={t.name} className="w-full h-32 object-cover rounded-xl mb-3 border border-[#CBC3E3]"/>
                    <h3 className="font-bold text-[#301934] text-base leading-snug">{t.name}</h3>
                    <p className="text-xs text-[#483248] mt-1 flex items-center gap-1 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#9F2B68] shrink-0"/>
                      {t.city} • {t.location}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#CBC3E3] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#AA98A9] font-mono">{t.screen_count || 2} Screens</span>
                      {selectedTheatreId === t.id && (<span className="text-[#9F2B68] font-bold flex items-center gap-1">
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
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedTheatreId === t.id
                          ? 'bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-white shadow-md'
                          : 'bg-[#E6E6FA] hover:bg-[#CBC3E3] text-[#702963] border border-[#CBC3E3]'
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
              <h2 className="text-xl font-bold text-[#301934]">Step 2: Select Movie & Show</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                Showing available shows at{' '}
                <span className="text-[#9F2B68] font-semibold">{selectedTheatre?.name}</span>.
              </p>
            </div>

            {availableShowsForTheatre.length === 0 ? (<div className="text-center py-12 text-[#AA98A9] font-medium">
                No shows available at this theatre. Please choose another cinema.
              </div>) : (<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availableShowsForTheatre.map((show) => (<div key={show.id} onClick={() => setSelectedShowId(show.id)} className={`cursor-pointer p-4 rounded-2xl border transition-all flex gap-4 items-center ${selectedShowId === show.id
                        ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
                        : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'}`}>
                    <img src={show.movie_poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'} alt={show.movie_title} className="w-16 h-24 object-cover rounded-xl shrink-0 border border-[#CBC3E3]"/>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-[#301934] text-sm line-clamp-1">
                        {show.movie_title}
                      </h4>
                      <p className="text-xs text-[#9F2B68] font-semibold">{show.screen_name}</p>
                      <p className="text-xs text-[#483248] flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#9F2B68]"/>
                        {show.show_date} • {show.start_time}
                      </p>
                      <p className="text-[11px] text-[#5D3FD3] font-bold font-mono">
                        Interval: {show.interval_start} - {show.interval_end}
                      </p>
                    </div>
                  </div>))}
              </div>)}
          </div>)}

        {/* STEP 3: Select Interval Slot */}
        {step === 3 && selectedShow && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#301934]">Step 3: Interval Intermission Slot</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                Review your interval intermission slot details.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-4 max-w-xl mx-auto shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-sm text-[#483248]">Cinema & Screen:</span>
                <span className="text-sm font-bold text-[#301934]">
                  {selectedTheatre?.name} — {selectedShow.screen_name}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-sm text-[#483248]">Movie Title:</span>
                <span className="text-sm font-bold text-[#9F2B68] font-cinema">{selectedShow.movie_title}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-sm text-[#483248]">Show Date & Time:</span>
                <span className="text-sm font-bold text-[#301934]">
                  {selectedShow.show_date} at {selectedShow.start_time}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3] bg-[#FFF0F7] p-3 rounded-xl border border-[#9F2B68]/30">
                <span className="text-sm text-[#9F2B68] font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#9F2B68]"/>
                  Designated Interval Window:
                </span>
                <span className="text-base font-black text-[#9F2B68] font-mono">
                  {selectedShow.interval_start} – {selectedShow.interval_end}
                </span>
              </div>
              <div className="text-xs text-[#483248] leading-relaxed pt-2">
                💡 Multiple guests may submit requests for this slot. Theatre staff reviews incoming
                requests and accepts exactly one; competing pending requests will automatically expire.
              </div>
            </div>
          </div>)}

        {/* STEP 4: Select Booking Purpose / Category */}
        {step === 4 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#301934]">Step 4: Select Booking Purpose</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                Choose the occasion so the cinema team formats the presentation appropriately.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bookingCategories.map((c) => (<div key={c.id} onClick={() => setBookingType(c.id)} className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${bookingType === c.id
                    ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
                    : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'}`}>
                  <div>
                    <span className="text-3xl block mb-2">{c.icon}</span>
                    <h3 className="font-bold text-[#301934] text-sm">{c.label}</h3>
                    <p className="text-xs text-[#483248] mt-1 line-clamp-2">{c.desc}</p>
                  </div>
                  {bookingType === c.id && (<span className="mt-3 text-xs text-[#9F2B68] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5"/> Selected
                    </span>)}
                </div>))}
            </div>
          </div>)}

        {/* STEP 5: Enter Message & Contact Info */}
        {step === 5 && (<div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-[#301934]">Step 5: Enter Your Message</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                This message will be prominently showcased on the giant auditorium screen.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#301934] mb-1.5 flex items-center justify-between">
                  <span>Big Screen Message (Required)</span>
                  <span className="text-[#AA98A9] font-mono">{message.length}/250 characters</span>
                </label>
                <textarea rows={4} maxLength={250} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. Will you marry me, Pooja? You make my world magical every day! ❤️" className="w-full px-4 py-3 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white text-sm leading-relaxed"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#301934] mb-1.5">
                  Contact Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2"/>
                  <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 (555) 012-3456" className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white"/>
                </div>
                <p className="text-[11px] text-[#AA98A9] mt-1 font-medium">
                  Allows theatre staff to coordinate cues or timing if necessary.
                </p>
              </div>
            </div>
          </div>)}

        {/* STEP 6: Upload Media */}
        {step === 6 && (<div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-[#301934]">Step 6: Upload Media (Optional)</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                Upload a photograph or video to accompany your message. Files are encrypted with
                AES-256-GCM.
              </p>
            </div>

            <div className="border-2 border-dashed border-[#CBC3E3] hover:border-[#9F2B68] rounded-3xl p-8 text-center transition-colors bg-[#F8F6FC] hover:bg-[#FFF0F7] relative">
              <input type="file" accept=".jpg,.jpeg,.png,.mp4,.webm" onChange={handleMediaUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
              <Upload className="w-10 h-10 text-[#9F2B68] mx-auto mb-3"/>
              <h4 className="text-sm font-bold text-[#301934]">Click or drag & drop media file</h4>
              <p className="text-xs text-[#483248] mt-1">Supported: JPG, PNG, MP4, WebM (Max 25MB)</p>

              {mediaFile && (<div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF0F7] border border-[#9F2B68]/30 text-[#9F2B68] text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#9F2B68]"/>
                  {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>)}
            </div>

            {mediaPreviewUrl && (<div className="p-4 rounded-2xl bg-white border border-[#CBC3E3] space-y-2 shadow-sm">
                <span className="text-xs font-semibold text-[#483248]">Media Preview:</span>
                {mediaType === 'IMAGE' ? (<img src={mediaPreviewUrl} alt="Upload Preview" className="max-h-48 rounded-xl object-contain mx-auto border border-[#CBC3E3]"/>) : (<video src={mediaPreviewUrl} controls className="max-h-48 rounded-xl bg-black mx-auto"/>)}
              </div>)}
          </div>)}

        {/* STEP 7: Cinema Screen Mockup Preview */}
        {step === 7 && (<div className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-[#301934]">Step 7: Live Cinema Big-Screen Preview</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                This simulation illustrates how your proposal will appear on the auditorium screen
                during the interval intermission.
              </p>
            </div>

            <ScreenMockupPreview message={message} bookingType={bookingType} mediaPreviewUrl={mediaPreviewUrl} mediaType={mediaType} movieTitle={selectedShow?.movie_title} theatreName={selectedTheatre?.name}/>
          </div>)}

        {/* STEP 8: Final Confirmation */}
        {step === 8 && (<div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-[#301934]">Step 8: Final Booking Confirmation</h2>
              <p className="text-xs text-[#483248] mt-1 font-medium">
                Please review your interval booking request before final submission.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-4 text-sm shadow-sm">
              <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-[#483248]">Theatre:</span>
                <span className="font-bold text-[#301934]">{selectedTheatre?.name}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-[#483248]">Movie & Screen:</span>
                <span className="font-bold text-[#301934]">
                  {selectedShow?.movie_title} ({selectedShow?.screen_name})
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-[#483248]">Date & Showtime:</span>
                <span className="font-bold text-[#301934]">
                  {selectedShow?.show_date} • {selectedShow?.start_time}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#CBC3E3] bg-[#FFF0F7] p-3 rounded-xl border border-[#9F2B68]/30">
                <span className="text-[#9F2B68] font-semibold">Interval Window:</span>
                <span className="font-bold text-[#9F2B68] font-mono">
                  {selectedShow?.interval_start} – {selectedShow?.interval_end}
                </span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                <span className="text-[#483248]">Category:</span>
                <span className="font-bold text-[#301934] capitalize">
                  {bookingType.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="space-y-1 pb-3 border-b border-[#CBC3E3]">
                <span className="text-[#483248] block">Screen Message:</span>
                <p className="p-3 rounded-xl bg-white text-[#702963] font-serif italic border border-[#CBC3E3]">
                  "{message}"
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-[#483248]">Encrypted Media:</span>
                <span className="font-semibold text-[#301934]">
                  {mediaFile ? `Attached (${mediaFile.name})` : 'Text only (no file attached)'}
                </span>
              </div>
            </div>

            {/* Step 8: Payment Gateway & Escrow Summary */}
            <div className="p-6 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-[#CBC3E3] pb-3">
                <span className="font-bold text-[#9F2B68] uppercase tracking-wider text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#9F2B68]" />
                  Select Payment Method
                </span>
                <span className="text-[#5D3FD3] font-semibold flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Escrow Protected
                </span>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('WALLET')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'WALLET'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-sm'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  <span className="block text-base mb-1">💳</span>
                  <span className="font-bold block text-xs">Wallet</span>
                  <span className="text-[10px] text-[#AA98A9]">
                    Bal: ₹{Number(user?.wallet_balance ?? 2000).toFixed(0)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-sm'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  <span className="block text-base mb-1">📱</span>
                  <span className="font-bold block text-xs">Instant UPI</span>
                  <span className="text-[10px] text-[#AA98A9]">QR / GPay / PhonePe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#9F2B68] shadow-sm'
                      : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                  }`}
                >
                  <span className="block text-base mb-1">⚡</span>
                  <span className="font-bold block text-xs">Card / NetBanking</span>
                  <span className="text-[10px] text-[#AA98A9]">Razorpay / Stripe</span>
                </button>
              </div>

              {/* Wallet Method View */}
              {paymentMethod === 'WALLET' && (
                <div className="p-4 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-2.5">
                  <div className="flex justify-between items-center text-[#483248]">
                    <span>Available Balance:</span>
                    <span className="font-bold text-[#301934] font-mono">₹{Number(user?.wallet_balance ?? 2000).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#483248]">
                    <span>Interval Booking Fee:</span>
                    <span className="font-bold text-[#301934] font-mono">₹{Number(selectedShow?.price_estimate || 500).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-[#CBC3E3] pt-2 text-[#9F2B68] font-bold">
                    <span>Remaining Wallet Balance:</span>
                    <span className="font-mono">
                      ₹{(Number(user?.wallet_balance ?? 2000) - Number(selectedShow?.price_estimate || 500)).toFixed(2)}
                    </span>
                  </div>

                  {Number(user?.wallet_balance ?? 2000) < Number(selectedShow?.price_estimate || 500) && (
                    <div className="pt-2 flex items-center justify-between bg-[#FFF0F4] p-2.5 rounded-lg border border-[#800020]/30">
                      <span className="text-[#800020] font-medium">Insufficient balance.</span>
                      <button
                        type="button"
                        onClick={() => setShowWalletModal(true)}
                        className="px-3 py-1 rounded-lg bg-[#9F2B68] hover:bg-[#BA3E7F] text-white font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Top Up Wallet
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR Code View */}
              {paymentMethod === 'UPI' && (
                <div className="p-4 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md border border-[#CBC3E3]">
                      <QrCode className="w-full h-full text-[#301934]" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#301934] block">Scan & Pay via any UPI App</span>
                      <span className="text-[11px] text-[#5D3FD3] block font-mono font-semibold">VPA: cinemoments@upi</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded bg-white border border-[#CBC3E3] text-[#483248] text-[10px] font-semibold">GPay</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#CBC3E3] text-[#483248] text-[10px] font-semibold">PhonePe</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#CBC3E3] text-[#483248] text-[10px] font-semibold">Paytm</span>
                        <span className="px-2 py-0.5 rounded bg-white border border-[#CBC3E3] text-[#483248] text-[10px] font-semibold">BHIM</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#FFF0F7] border border-[#9F2B68]/30 text-[#9F2B68] text-[11px] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Instant UPI confirmation enabled. Click Submit to verify and reserve.</span>
                  </div>
                </div>
              )}

              {/* Card / Gateway View */}
              {paymentMethod === 'CARD' && (
                <div className="p-4 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#301934]">Debit / Credit Card Details</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('4242 •••• •••• 4242');
                        setCardExpiry('12/28');
                        setCardCvv('789');
                      }}
                      className="text-[10px] text-[#9F2B68] hover:text-[#BF40BF] font-bold underline cursor-pointer"
                    >
                      Fill Demo Test Card
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#CBC3E3] text-[#301934] text-xs focus:outline-none focus:border-[#9F2B68] font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM / YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#CBC3E3] text-[#301934] text-xs focus:outline-none focus:border-[#9F2B68] font-mono"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#CBC3E3] text-[#301934] text-xs focus:outline-none focus:border-[#9F2B68] font-mono"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#AA98A9] block font-medium">
                    Powered by Razorpay & Stripe Gateway Engine.
                  </span>
                </div>
              )}

              {/* Total Payable & Guarantee */}
              <div className="pt-2 border-t border-[#CBC3E3] flex justify-between items-center text-sm">
                <span className="text-[#483248] font-medium">Total Payable Amount:</span>
                <span className="font-black text-[#9F2B68] text-base font-mono">
                  ₹{Number(selectedShow?.price_estimate || 500).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#F8F6FC] text-xs text-[#483248] leading-relaxed border border-[#CBC3E3]">
              🛡️ Upon submission, your request enters <strong className="text-[#9F2B68]">PENDING</strong>{' '}
              status. The theatre staff will review your content. If rejected or cancelled,
              funds are 100% refunded immediately to your account.
            </div>
          </div>)}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        {step > 1 ? (<button type="button" onClick={handleBack} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#483248] hover:text-[#301934] border border-[#CBC3E3] text-sm font-semibold transition-colors cursor-pointer shadow-sm">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>) : (<div />)}

        {step < 8 ? (<button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-sm font-bold shadow-md shadow-[#9F2B68]/20 transition-all cursor-pointer">
            Continue <ArrowRight className="w-4 h-4"/>
          </button>) : (<button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (paymentMethod === 'WALLET' && Number(user?.wallet_balance ?? 2000) < Number(selectedShow?.price_estimate || 500))}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-sm font-bold shadow-lg shadow-[#9F2B68]/30 transition-all disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Processing Payment & Submitting...' : `Pay ₹${Number(selectedShow?.price_estimate || 500).toFixed(2)} & Reserve Slot`}
          </button>)}
      </div>

      {/* Digital Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => {
            setActiveReceipt(null);
            navigate('/dashboard?success=1');
          }}
        />
      )}

      {/* Wallet Top-up Modal */}
      <WalletTopupModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>);
};

