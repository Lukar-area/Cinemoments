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
    XCircle,
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
    Film,
    Ticket,
    MapPin,
} from 'lucide-react';

export const BookingWizardPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    // Wizard Steps (1 through 8)
    const [step, setStep] = useState(1);

    // Data Collections
    const [theatres, setTheatres] = useState([]);
    const [moviesForTheatre, setMoviesForTheatre] = useState([]);
    const [showsForMovie, setShowsForMovie] = useState([]);
    const [allShows, setAllShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMovies, setLoadingMovies] = useState(false);
    const [loadingShows, setLoadingShows] = useState(false);

    // Form Selections
    const [selectedTheatreId, setSelectedTheatreId] = useState(null);
    const [selectedMovieId, setSelectedMovieId] = useState(null);
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

    // Load initial theatres (active booking schedules only) and all shows for query param resolution
    useEffect(() => {
        async function init() {
            try {
                setLoading(true);
                const [theatresRes, showsRes] = await Promise.all([
                    api.theatres.getAll({ activeSchedulesOnly: true }),
                    api.shows.getShows(),
                ]);
                let loadedTheatres = theatresRes?.theatres || [];
                const loadedShows = showsRes?.shows || [];

                if (loadedTheatres.length === 0) {
                    const fallbackAllTheatres = await api.theatres.getAll();
                    loadedTheatres = fallbackAllTheatres?.theatres || [];
                }

                setTheatres(loadedTheatres);
                setAllShows(loadedShows);

                // Handle deep-linking via query parameters
                const queryShowId = searchParams.get('showId');
                const queryTheatreId = searchParams.get('theatreId');
                const queryMovieId = searchParams.get('movieId');
                const queryCategory = searchParams.get('category');

                if (queryCategory) {
                    setBookingType(queryCategory);
                }

                if (queryShowId) {
                    const matchedShow = loadedShows.find(s => s.id?.toString() === queryShowId.toString());
                    if (matchedShow) {
                        const tId = matchedShow.theatre_id;
                        const mId = matchedShow.movie_id;
                        setSelectedTheatreId(tId);
                        setSelectedMovieId(mId);
                        setSelectedShowId(matchedShow.id);

                        // Load movies for that theatre
                        if (tId) {
                            const moviesRes = await api.movies.getAll({ theatreId: tId });
                            setMoviesForTheatre(moviesRes.movies || []);
                        }
                        // Load shows for that movie
                        if (tId && mId) {
                            const showsResSub = await api.shows.getShows({ theatreId: tId, movieId: mId });
                            setShowsForMovie(showsResSub.shows || []);
                        }
                        setStep(4); // Advance directly to Interval Slot review
                        return;
                    }
                }

                if (queryTheatreId) {
                    setSelectedTheatreId(queryTheatreId);
                    const moviesRes = await api.movies.getAll({ theatreId: queryTheatreId });
                    const mList = moviesRes.movies || [];
                    setMoviesForTheatre(mList);

                    if (queryMovieId) {
                        setSelectedMovieId(queryMovieId);
                        const showsResSub = await api.shows.getShows({ theatreId: queryTheatreId, movieId: queryMovieId });
                        setShowsForMovie(showsResSub.shows || []);
                        setStep(3); // Advance to show selection
                    } else {
                        setStep(2); // Advance to movies view
                    }
                }
            } catch (err) {
                console.error('Failed to initialize booking wizard:', err);
            } finally {
                setLoading(false);
            }
        }
        init();
    }, [searchParams]);

    // When theatre selection changes, dynamically load movies scheduled at that theatre
    const handleSelectTheatre = async (theatreId) => {
        try {
            setErrorMessage(null);
            setSelectedTheatreId(theatreId);
            setSelectedMovieId(null);
            setSelectedShowId(null);
            setLoadingMovies(true);

            const res = await api.movies.getAll({ theatreId });
            let mList = res?.movies || [];
            if (mList.length === 0) {
                const allMoviesRes = await api.movies.getAll();
                mList = allMoviesRes?.movies || [];
            }
            setMoviesForTheatre(mList);
            setStep(2); // Advance to View Movies
        } catch (err) {
            setErrorMessage('Failed to load movies for this theatre.');
        } finally {
            setLoadingMovies(false);
        }
    };

    // When movie selection changes, dynamically load shows for this movie at this theatre
    const handleSelectMovie = async (movieId) => {
        try {
            setErrorMessage(null);
            setSelectedMovieId(movieId);
            setSelectedShowId(null);
            setLoadingShows(true);

            const res = await api.shows.getShows({
                theatreId: selectedTheatreId,
                movieId,
            });
            setShowsForMovie(res.shows || []);
            setStep(3); // Advance to Select Show
        } catch (err) {
            setErrorMessage('Failed to load showtimes for this movie.');
        } finally {
            setLoadingShows(false);
        }
    };

    // When show is selected, advance to Interval Slot
    const handleSelectShow = (show) => {
        setSelectedShowId(show.id);
        setErrorMessage(null);
        setStep(4); // Advance to View & Lock Interval Slot
    };

    // Media file selection and preview handler
    const handleMediaUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            setErrorMessage('Please select a cinema theatre to proceed.');
            return;
        }
        if (step === 2 && !selectedMovieId) {
            setErrorMessage('Please select a movie to view available showtimes.');
            return;
        }
        if (step === 3 && !selectedShowId) {
            setErrorMessage('Please select a showtime to proceed.');
            return;
        }
        if (step === 4) {
            const currentShow = showsForMovie.find(s => s.id === selectedShowId) || allShows.find(s => s.id === selectedShowId);
            if (currentShow?.is_interval_booked) {
                setErrorMessage(`Slot Occupied: This interval slot for ${selectedTheatre?.name || 'this theatre'} has already been occupied. Please choose an open showtime.`);
                return;
            }
        }
        if (step === 6 && (!message || message.trim().length < 5)) {
            setErrorMessage('Please enter your big screen interval message (minimum 5 characters).');
            return;
        }
        setStep((prev) => Math.min(prev + 1, 8));
    };

    const handleBack = () => {
        setErrorMessage(null);
        setStep((prev) => Math.max(prev - 1, 1));
    };

    // Resolved Selected Objects
    const selectedTheatre = theatres.find((t) => t.id === selectedTheatreId);
    const selectedMovie = moviesForTheatre.find((m) => m.id === selectedMovieId);
    const selectedShow = showsForMovie.find((s) => s.id === selectedShowId) || allShows.find((s) => s.id === selectedShowId);

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
            if (contactPhone) formData.append('contactPhone', contactPhone.trim());
            if (mediaFile) formData.append('media', mediaFile);

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
                    movieTitle: selectedMovie?.title || selectedShow?.movie_title,
                    showDate: selectedShow?.show_date,
                    intervalSlot: `${selectedShow?.interval_start} – ${selectedShow?.interval_end}`,
                },
                payment: {
                    totalAmount: Number(selectedShow?.price_estimate || 500),
                    paymentMethod,
                    paymentId,
                    status: 'COMPLETED',
                },
            };

            setActiveReceipt(receipt);
        } catch (err) {
            setErrorMessage(err.message || 'Failed to submit interval booking request.');
        } finally {
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

    const sceneTitles = [
        'SELECT AUDITORIUM',
        'VIEW MOVIES AT THEATRE',
        'CHOOSE MOVIE SHOWTIME',
        'LOCK INTERVAL SLOT',
        'SELECT OCCASION THEME',
        'COMPOSE SCREEN MESSAGE',
        'MEDIA UPLOAD & STAGE PREVIEW',
        'VIRTUAL PAYMENT & STATUS',
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Wizard Header */}
            <div className="text-center space-y-2">
                <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em] flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#9F2B68]" />
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
                        SCENE {step} / 8: {sceneTitles[step - 1]}
                    </span>
                    <span className="text-[#5D3FD3]">{Math.round((step / 8) * 100)}% COMPLETE</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#E6E6FA] overflow-hidden border border-[#CBC3E3]">
                    <div
                        className="h-full bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${(step / 8) * 100}%` }}
                    />
                </div>
            </div>

            {/* Error Alert Box */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 flex items-center gap-3 text-[#800020] text-sm font-mono">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Step Content Container */}
            <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#CBC3E3] shadow-md min-h-[420px]">
                {/* STEP 1: Select Cinema Theatre */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                <Building2 className="w-3.5 h-3.5" /> STEP 1: PARTNER THEATRES
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                Choose Your Cinema Theatre
                            </h2>
                            <p className="text-xs text-[#483248] mt-1 font-medium">
                                Showing partner cinemas with valid, active booking schedules. Select where you want your intermission content screened.
                            </p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-72 rounded-2xl bg-[#F8F6FC] animate-pulse border border-[#CBC3E3]" />
                                ))}
                            </div>
                        ) : theatres.length === 0 ? (
                            <div className="text-center py-12 text-[#AA98A9] font-medium cinema-card-ambient rounded-2xl">
                                No theatres with active schedules currently available.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {theatres.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => handleSelectTheatre(t.id)}
                                        className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                                            selectedTheatreId === t.id
                                                ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
                                                : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <div className="relative h-36 rounded-xl overflow-hidden mb-3 border border-[#CBC3E3]">
                                                <img
                                                    src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80'}
                                                    alt={t.name}
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/95 text-[#9F2B68] border border-[#CBC3E3]">
                                                    {t.city}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-[#301934] text-base leading-snug font-cinema">
                                                {t.name}
                                            </h3>

                                            <p className="text-xs text-[#483248] mt-1 flex items-center gap-1 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-[#9F2B68] shrink-0" />
                                                {t.location}
                                            </p>

                                            {/* Facilities */}
                                            <div className="mt-2.5 pt-2 border-t border-[#CBC3E3]/60">
                                                <span className="text-[10px] font-mono font-bold text-[#9F2B68] uppercase block mb-1">
                                                    Facilities:
                                                </span>
                                                <div className="flex flex-wrap gap-1">
                                                    {(t.facilities || [
                                                        '4K Laser Projection',
                                                        'Dolby Atmos',
                                                        'Playout System',
                                                    ]).slice(0, 2).map((fac, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F6FC] border border-[#CBC3E3] text-[#301934]"
                                                        >
                                                            {fac}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-[#CBC3E3] space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[#AA98A9] font-mono">
                                                    {t.screen_count || 2} Screens • {t.active_movies_count || 0} Movies
                                                </span>
                                                {selectedTheatreId === t.id && (
                                                    <span className="text-[#9F2B68] font-bold flex items-center gap-1">
                                                        <Check className="w-4 h-4" /> Selected
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase font-mono tracking-wider ${
                                                    selectedTheatreId === t.id
                                                        ? 'bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-white shadow-md'
                                                        : 'bg-[#E6E6FA] hover:bg-[#CBC3E3] text-[#702963] border border-[#CBC3E3]'
                                                }`}
                                            >
                                                {selectedTheatreId === t.id ? 'View Scheduled Movies →' : 'Select Cinema Theatre'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 2: View Movies Currently Scheduled at Selected Theatre */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBC3E3] pb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                    <Film className="w-3.5 h-3.5" /> STEP 2: MOVIES AT THEATRE
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                    Movies Currently Scheduled at {selectedTheatre?.name}
                                </h2>
                                <p className="text-xs text-[#483248] mt-1 font-medium">
                                    Select the movie during which your intermission broadcast will run.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="text-xs font-mono font-bold text-[#9F2B68] hover:underline"
                            >
                                Change Theatre
                            </button>
                        </div>

                        {loadingMovies ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-72 rounded-2xl bg-[#F8F6FC] animate-pulse border border-[#CBC3E3]" />
                                ))}
                            </div>
                        ) : moviesForTheatre.length === 0 ? (
                            <div className="text-center py-16 cinema-card-ambient rounded-3xl border border-[#CBC3E3] space-y-3">
                                <Film className="w-12 h-12 text-[#AA98A9] mx-auto" />
                                <h3 className="text-base font-bold text-[#301934] font-cinema">
                                    No movies currently available at this theatre.
                                </h3>
                                <p className="text-xs text-[#5E435E]">
                                    Please choose another cinema that has active upcoming screenings.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-4 py-2 rounded-xl bg-[#E6E6FA] text-[#9F2B68] font-bold text-xs font-mono uppercase"
                                >
                                    ← Back to Theatres
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {moviesForTheatre.map((movie) => (
                                    <div
                                        key={movie.id}
                                        onClick={() => handleSelectMovie(movie.id)}
                                        className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                                            selectedMovieId === movie.id
                                                ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/15'
                                                : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'
                                        }`}
                                    >
                                        <div>
                                            <div className="relative h-52 rounded-xl overflow-hidden mb-3 border border-[#CBC3E3]">
                                                <img
                                                    src={movie.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#9F2B68] border border-[#CBC3E3]">
                                                    {movie.rating || 'PG-13'}
                                                </span>
                                                <span className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#5D3FD3] text-white">
                                                    {movie.duration} min
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-[#301934] text-base leading-snug font-cinema line-clamp-1">
                                                {movie.title}
                                            </h3>

                                            <p className="text-xs text-[#9F2B68] font-semibold mt-1">
                                                {movie.genre || 'Action / Drama'}
                                            </p>

                                            <p className="text-xs text-[#5E435E] font-medium mt-0.5">
                                                Language: {movie.language || 'English'}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-[#CBC3E3] space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[#5D3FD3] font-mono font-bold">
                                                    {movie.upcoming_shows_count || 1} Showtimes
                                                </span>
                                                {selectedMovieId === movie.id && (
                                                    <span className="text-[#9F2B68] font-bold flex items-center gap-1">
                                                        <Check className="w-3.5 h-3.5" /> Selected
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all uppercase font-mono tracking-wider ${
                                                    selectedMovieId === movie.id
                                                        ? 'bg-[#9F2B68] text-white shadow-md'
                                                        : 'bg-[#E6E6FA] text-[#702963] hover:bg-[#CBC3E3]'
                                                }`}
                                            >
                                                {selectedMovieId === movie.id ? 'View Showtimes →' : 'Select Movie'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: Select Movie Showtime */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBC3E3] pb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                    <Calendar className="w-3.5 h-3.5" /> STEP 3: SELECT SHOWTIME
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                    Showtimes for {selectedMovie?.title} at {selectedTheatre?.name}
                                </h2>
                                <p className="text-xs text-[#483248] mt-1 font-medium">
                                    Choose the show date and time to inspect its intermission interval slot.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="text-xs font-mono font-bold text-[#9F2B68] hover:underline"
                            >
                                Change Movie
                            </button>
                        </div>

                        {loadingShows ? (
                            <div className="space-y-4">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-24 rounded-2xl bg-[#F8F6FC] animate-pulse border border-[#CBC3E3]" />
                                ))}
                            </div>
                        ) : showsForMovie.length === 0 ? (
                            <div className="text-center py-12 text-[#AA98A9] font-medium cinema-card-ambient rounded-2xl">
                                No showtimes currently scheduled for this movie. Please choose another movie.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {showsForMovie.map((show) => (
                                    <div
                                        key={show.id}
                                        onClick={() => handleSelectShow(show)}
                                        className={`cursor-pointer p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                                            selectedShowId === show.id
                                                ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
                                                : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={show.movie_poster || selectedMovie?.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'}
                                                alt={show.movie_title}
                                                className="w-16 h-24 object-cover rounded-xl shrink-0 border border-[#CBC3E3]"
                                            />
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-[#301934] text-base font-cinema">
                                                    {show.movie_title || selectedMovie?.title}
                                                </h4>
                                                <p className="text-xs text-[#9F2B68] font-bold font-mono">
                                                    {show.screen_name} • {show.screen_type}
                                                </p>
                                                <p className="text-xs text-[#483248] flex items-center gap-1 font-medium">
                                                    <Calendar className="w-3.5 h-3.5 text-[#9F2B68]" />
                                                    {show.show_date} • {show.start_time} to {show.end_time}
                                                </p>
                                                <p className="text-xs text-[#5D3FD3] font-mono font-bold flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 text-[#5D3FD3]" />
                                                    Interval: {show.interval_start} – {show.interval_end}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-[#E6E6FA]">
                                            {show.is_interval_booked ? (
                                                <span className="flex items-center gap-1.5 text-xs text-[#800020] font-mono font-bold px-2.5 py-1 rounded-full bg-[#FFF0F4] border border-[#800020]/20">
                                                    <XCircle className="w-3.5 h-3.5 text-[#800020]" />
                                                    Occupied for this Theatre
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-[#9F2B68] font-mono font-bold px-2.5 py-1 rounded-full bg-[#FFF0F7] border border-[#9F2B68]/20">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9F2B68]" />
                                                    Interval Open
                                                </span>
                                            )}

                                            <button
                                                type="button"
                                                className={`py-2 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                                                    selectedShowId === show.id
                                                        ? 'bg-gradient-to-r from-[#9F2B68] to-[#BF40BF] text-white shadow-md'
                                                        : 'bg-[#E6E6FA] text-[#702963] hover:bg-[#CBC3E3]'
                                                }`}
                                            >
                                                {selectedShowId === show.id ? 'Selected Slot →' : 'Select Showtime'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: View & Lock Interval Intermission Slot */}
                {step === 4 && selectedShow && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBC3E3] pb-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                    <Clock className="w-3.5 h-3.5" /> STEP 4: INTERVAL INTERMISSION SLOT
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                    Designated Interval Intermission Slot
                                </h2>
                                <p className="text-xs text-[#483248] mt-1 font-medium">
                                    Review the exact interval slot timing for this movie and show before customizing your proposal.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="text-xs font-mono font-bold text-[#9F2B68] hover:underline"
                            >
                                Change Showtime
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 rounded-3xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-5 max-w-xl mx-auto shadow-sm">
                            <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-xs font-mono uppercase text-[#483248] font-bold">Selected Cinema:</span>
                                <span className="text-sm font-bold text-[#301934] font-cinema">
                                    {selectedTheatre?.name || selectedShow.theatre_name}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-xs font-mono uppercase text-[#483248] font-bold">Screen & Hall:</span>
                                <span className="text-sm font-bold text-[#301934] font-mono">
                                    {selectedShow.screen_name} ({selectedShow.screen_type || 'Laser 4K'})
                                </span>
                            </div>

                            <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-xs font-mono uppercase text-[#483248] font-bold">Movie Feature:</span>
                                <span className="text-base font-bold text-[#9F2B68] font-cinema">
                                    {selectedMovie?.title || selectedShow.movie_title}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-xs font-mono uppercase text-[#483248] font-bold">Showtime:</span>
                                <span className="text-sm font-bold text-[#301934] font-mono">
                                    {selectedShow.show_date} • {selectedShow.start_time} to {selectedShow.end_time}
                                </span>
                            </div>

                            {/* Interval Slot Box */}
                            <div className="p-4 rounded-2xl bg-[#FFF0F7] border-2 border-[#9F2B68] space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#9F2B68] uppercase flex items-center gap-1.5 font-mono">
                                        <Clock className="w-4 h-4 text-[#9F2B68]" />
                                        Exclusive Interval Window:
                                    </span>
                                    <span className="text-lg font-black text-[#9F2B68] font-mono">
                                        {selectedShow.interval_start} – {selectedShow.interval_end}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs pt-1 border-t border-[#9F2B68]/20">
                                    <span className="text-[#483248]">Slot Booking Rate:</span>
                                    <span className="font-bold text-[#9F2B68] font-mono text-sm">
                                        ₹{Number(selectedShow.price_estimate || 500).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Slot Availability Indicator */}
                            {selectedShow.is_interval_booked ? (
                                <div className="p-4 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 text-[#800020] text-xs font-mono space-y-1">
                                    <div className="flex items-center gap-2 font-bold text-sm text-[#800020]">
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        <span>Slot Occupied for {selectedTheatre?.name || selectedShow.theatre_name || 'this Theatre'}</span>
                                    </div>
                                    <p className="text-[11px] text-[#800020]/80">
                                        This interval slot has already been occupied and allotted by theatre staff. Duplicate bookings cannot be accepted. Please choose another showtime.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3.5 rounded-xl bg-[#E6E6FA] border border-[#CBC3E3] text-[#301934] text-xs font-mono flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[#9F2B68] shrink-0" />
                                    <span>
                                        This interval slot is currently OPEN and ready for your booking reservation.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 5: Select Booking Purpose / Category */}
                {step === 5 && (
                    <div className="space-y-6">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                <Sparkles className="w-3.5 h-3.5" /> STEP 5: OCCASION THEME
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                Select Celebration Theme
                            </h2>
                            <p className="text-xs text-[#483248] mt-1 font-medium">
                                Choose the occasion so the cinema team formats the presentation audio and visual cues appropriately.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {bookingCategories.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => setBookingType(c.id)}
                                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                        bookingType === c.id
                                            ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/10'
                                            : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'
                                    }`}
                                >
                                    <div>
                                        <span className="text-3xl block mb-2">{c.icon}</span>
                                        <h3 className="font-bold text-[#301934] text-sm">{c.label}</h3>
                                        <p className="text-xs text-[#483248] mt-1 line-clamp-2">{c.desc}</p>
                                    </div>
                                    {bookingType === c.id && (
                                        <span className="mt-3 text-xs text-[#9F2B68] font-bold flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Selected
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 6: Enter Message & Contact Phone */}
                {step === 6 && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                💬 STEP 6: SCREEN MESSAGE
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                Compose Big Screen Message
                            </h2>
                            <p className="text-xs text-[#483248] mt-1 font-medium">
                                This message will be prominently showcased on the giant auditorium screen during the interval.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#301934] mb-1.5 flex items-center justify-between">
                                    <span>Big Screen Message (Required)</span>
                                    <span className="text-[#AA98A9] font-mono">{message.length}/250 characters</span>
                                </label>
                                <textarea
                                    rows={4}
                                    maxLength={250}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="e.g. Will you marry me, Pooja? You make my world magical every day! ❤️"
                                    className="w-full px-4 py-3 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white text-sm leading-relaxed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#301934] mb-1.5">
                                    Contact Phone Number (Optional)
                                </label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-[#AA98A9] absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="tel"
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        placeholder="+91-98765-01234"
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] focus:bg-white"
                                    />
                                </div>
                                <p className="text-[11px] text-[#AA98A9] mt-1 font-medium">
                                    Allows theatre staff to coordinate cues or timing if necessary.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 7: Upload Media & Live Stage Mockup Preview */}
                {step === 7 && (
                    <div className="space-y-6">
                        <div className="text-center max-w-xl mx-auto">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                🎬 STEP 7: AUDITORIUM PREVIEW
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                Live Cinema Big-Screen Preview
                            </h2>
                            <p className="text-xs text-[#483248] mt-1 font-medium">
                                Review your simulated big screen display as it will project in the auditorium.
                            </p>
                        </div>

                        {/* Media Upload Area */}
                        <div className="max-w-2xl mx-auto border-2 border-dashed border-[#CBC3E3] hover:border-[#9F2B68] rounded-3xl p-6 text-center transition-colors bg-[#F8F6FC] hover:bg-[#FFF0F7] relative">
                            <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.mp4,.webm"
                                onChange={handleMediaUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <Upload className="w-8 h-8 text-[#9F2B68] mx-auto mb-2" />
                            <h4 className="text-sm font-bold text-[#301934]">Click or drag & drop 4K media asset (Optional)</h4>
                            <p className="text-xs text-[#483248] mt-0.5">Supported: JPG, PNG, MP4, WebM (Max 25MB)</p>

                            {mediaFile && (
                                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF0F7] border border-[#9F2B68]/30 text-[#9F2B68] text-xs font-semibold">
                                    <CheckCircle2 className="w-4 h-4 text-[#9F2B68]" />
                                    {mediaFile.name} ({(mediaFile.size / (1024 * 1024)).toFixed(2)} MB)
                                </div>
                            )}
                        </div>

                        {/* Screen Mockup Simulator */}
                        <ScreenMockupPreview
                            message={message}
                            bookingType={bookingType}
                            mediaPreviewUrl={mediaPreviewUrl}
                            mediaType={mediaType}
                            movieTitle={selectedMovie?.title || selectedShow?.movie_title}
                            theatreName={selectedTheatre?.name}
                        />
                    </div>
                )}

                {/* STEP 8: Final Confirmation & Virtual Payment */}
                {step === 8 && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] text-xs font-mono font-bold uppercase mb-1">
                                💳 STEP 8: PROJECTION LOCK & PAYMENT
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-[#301934] font-cinema">
                                Confirm & Authorize Booking
                            </h2>
                            <p className="text-xs text-[#483248] mt-1 font-medium">
                                Review your interval intermission details and complete virtual settlement.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-4 text-sm shadow-sm">
                            <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-[#483248]">Theatre & City:</span>
                                <span className="font-bold text-[#301934] font-cinema">
                                    {selectedTheatre?.name} ({selectedTheatre?.city})
                                </span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-[#483248]">Movie & Screen:</span>
                                <span className="font-bold text-[#301934]">
                                    {selectedMovie?.title || selectedShow?.movie_title} — {selectedShow?.screen_name}
                                </span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-[#483248]">Date & Showtime:</span>
                                <span className="font-bold text-[#301934] font-mono">
                                    {selectedShow?.show_date} • {selectedShow?.start_time}
                                </span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-[#CBC3E3] bg-[#FFF0F7] p-3 rounded-xl border border-[#9F2B68]/30">
                                <span className="text-[#9F2B68] font-semibold flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    Interval Slot:
                                </span>
                                <span className="font-bold text-[#9F2B68] font-mono">
                                    {selectedShow?.interval_start} – {selectedShow?.interval_end}
                                </span>
                            </div>
                            <div className="flex justify-between pb-3 border-b border-[#CBC3E3]">
                                <span className="text-[#483248]">Occasion Category:</span>
                                <span className="font-bold text-[#301934] capitalize font-mono">
                                    {bookingType.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="space-y-1 pb-3 border-b border-[#CBC3E3]">
                                <span className="text-[#483248] block">Big Screen Message:</span>
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

                        {/* Payment Gateway Options */}
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

                            {/* UPI View */}
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
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-[#FFF0F7] border border-[#9F2B68]/30 text-[#9F2B68] text-[11px] flex items-center gap-1.5 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                        <span>Instant UPI authorization enabled. Click submit below to confirm.</span>
                                    </div>
                                </div>
                            )}

                            {/* Card View */}
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
                                </div>
                            )}

                            {/* Total Payable */}
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
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
                {step > 1 ? (
                    <button
                        type="button"
                        onClick={handleBack}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#483248] hover:text-[#301934] border border-[#CBC3E3] text-sm font-semibold transition-colors cursor-pointer shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                ) : (
                    <div />
                )}

                {step < 8 ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-sm font-bold shadow-md shadow-[#9F2B68]/20 transition-all cursor-pointer"
                    >
                        Continue <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || (paymentMethod === 'WALLET' && Number(user?.wallet_balance ?? 2000) < Number(selectedShow?.price_estimate || 500))}
                        className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-sm font-bold shadow-lg shadow-[#9F2B68]/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {submitting ? 'Processing Payment & Submitting...' : `Pay ₹${Number(selectedShow?.price_estimate || 500).toFixed(2)} & Reserve Slot`}
                    </button>
                )}
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
        </div>
    );
};
