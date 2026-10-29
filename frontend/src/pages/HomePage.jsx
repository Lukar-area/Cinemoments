import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  Sparkles,
  Film,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  PartyPopper,
  Eye,
  CheckCircle,
  Volume2,
  Tv,
  Play,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const HomePage = () => {
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Live Cinema Studio state in Hero
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [customStudioText, setCustomStudioText] = useState('Ananya, Will You Marry Me?');
  const [studioCategory, setStudioCategory] = useState('MARRIAGE_PROPOSAL');
  const [studioAspect, setStudioAspect] = useState('2.39:1'); // '2.39:1' or '16:9'

  const demoReels = [
    {
      title: 'Ananya, Will You Marry Me?',
      category: 'MARRIAGE PROPOSAL',
      theatre: 'PVR IMAX Screen 1',
      bgGradient: 'from-[#301934] via-[#702963] to-[#9F2B68]',
      textColor: 'text-[#E6E6FA]',
      badge: '💍 Romantic Premiere',
    },
    {
      title: 'Happy 25th Birthday, Rahul!',
      category: 'BIRTHDAY CELEBRATION',
      theatre: 'INOX Megaplex Screen 3',
      bgGradient: 'from-[#201023] via-[#452CA8] to-[#BF40BF]',
      textColor: 'text-[#CF9FFF]',
      badge: '🎂 Blockbuster Shoutout',
    },
    {
      title: 'Celebrating 30 Years of Love: Mom & Dad',
      category: 'ANNIVERSARY',
      theatre: 'Cinepolis Dolby Atmos 5',
      bgGradient: 'from-[#5E0017] via-[#800020] to-[#AA336A]',
      textColor: 'text-[#DA70D6]',
      badge: '🎉 Golden Milestone',
    },
    {
      title: 'Apex Studio: Web3 Gaming Unleashed',
      category: 'COMMERCIAL AD',
      theatre: 'SPI Cinemas Sathyam',
      bgGradient: 'from-[#190C1B] via-[#5D3FD3] to-[#9F2B68]',
      textColor: 'text-white',
      badge: '📢 4K Brand Blast',
    },
  ];

  // Auto-cycle demo reels every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReelIndex((prev) => (prev + 1) % demoReels.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [demoReels.length]);

  useEffect(() => {
    async function loadData() {
      try {
        const [theatresRes, showsRes] = await Promise.all([
          api.theatres.getAll(),
          api.shows.getShows(),
        ]);
        setTheatres(theatresRes.theatres.slice(0, 3));
        setShows(showsRes.shows.slice(0, 4));
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = [
    {
      id: 'MARRIAGE_PROPOSAL',
      title: 'Marriage Proposal',
      icon: '💍',
      tagline: 'The Ultimate Silver Screen Gesture',
      desc: 'Ask the biggest question of your life in 4K laser projection with hundreds cheering in unison.',
      badge: 'Most Popular',
      color: 'from-[#FFF0F7] via-[#FCE8F3] to-[#F5D5E7] border-[#AA336A]/40 text-[#301934]',
      badgeColor: 'bg-[#9F2B68] text-white',
      glow: 'hover:shadow-glow-amaranth',
    },
    {
      id: 'LOVE_PROPOSAL',
      title: 'Love Proposal',
      icon: '❤️',
      tagline: 'Heartfelt Confession in 70mm',
      desc: 'Declare your love with high-resolution memories and emotional musical accompaniment.',
      color: 'from-[#FFF0F4] via-[#FCE4EC] to-[#F8D0DF] border-[#800020]/30 text-[#301934]',
      badgeColor: 'bg-[#800020] text-white',
      glow: 'hover:shadow-glow-red',
    },
    {
      id: 'BIRTHDAY',
      title: 'Birthday Surprises',
      icon: '🎂',
      tagline: 'A Premiere Party Shout-Out',
      desc: 'Surprise your best friend or family member before the second half starts with a viral shout-out.',
      color: 'from-[#F8F5FF] via-[#F1ECFE] to-[#E6E0FC] border-[#5D3FD3]/30 text-[#301934]',
      badgeColor: 'bg-[#5D3FD3] text-white',
      glow: 'hover:shadow-glow-iris',
    },
    {
      id: 'ADVERTISEMENT',
      title: 'Commercial Ads',
      icon: '📢',
      tagline: 'Hyper-Targeted High-Impact Reach',
      desc: 'Broadcast your business, startup, or product to a 100% captive, distraction-free audience.',
      badge: 'High ROI',
      color: 'from-[#FDF5FF] via-[#F8EAFF] to-[#F1D6FF] border-[#BF40BF]/30 text-[#301934]',
      badgeColor: 'bg-[#BF40BF] text-white',
      glow: 'hover:shadow-glow-purple',
    },
    {
      id: 'CELEBRATION',
      title: 'Anniversaries & Milestones',
      icon: '🎉',
      tagline: 'Honor Lifelong Triumphs',
      desc: 'Celebrate 25th anniversaries, retirement honors, and graduations where movies make history.',
      color: 'from-[#FAF4F9] via-[#F3E7F2] to-[#E9D6E7] border-[#702963]/30 text-[#301934]',
      badgeColor: 'bg-[#702963] text-white',
      glow: 'hover:shadow-glow-amaranth',
    },
    {
      id: 'PROMOTION',
      title: 'Campus & Festival Promos',
      icon: '🏢',
      tagline: 'Regional Culturals & Tournaments',
      desc: 'Promote college fests, concerts, hackathons, and regional sports events directly to local youth.',
      color: 'from-[#FDF7F8] via-[#F9ECEE] to-[#F2D7DB] border-[#915F6D]/30 text-[#301934]',
      badgeColor: 'bg-[#915F6D] text-white',
      glow: 'hover:shadow-glow-purple',
    },
  ];

  const steps = [
    {
      reel: 'REEL 01',
      title: 'Select Premier Venue',
      desc: 'Choose from top tier multiplexes and laser auditoriums equipped with dedicated intermission servers.',
      icon: Building2,
    },
    {
      reel: 'REEL 02',
      title: 'Target Movie & Showtime',
      desc: 'Pick the blockbuster movie, exact screen, and the designated interval intermission window.',
      icon: Film,
    },
    {
      reel: 'REEL 03',
      title: 'Direct Your Content',
      desc: 'Upload high-resolution media (photos/video) with your personal message or promotional banner.',
      icon: Sparkles,
    },
    {
      reel: 'REEL 04',
      title: 'Auditorium Review',
      desc: 'Authorized theatre projection staff reviews and verifies formatting to ensure cinema broadcast standards.',
      icon: Eye,
    },
    {
      reel: 'REEL 05',
      title: 'Atomic 1-Slot Lock',
      desc: 'Our atomic system accepts your slot and guarantees exclusive interval screening — zero double bookings.',
      icon: CheckCircle,
    },
    {
      reel: 'REEL 06',
      title: 'Curtain Call: Big Screen',
      desc: 'The lights dim, the interval arrives, and your story illuminates the grand silver screen in 4K.',
      icon: PartyPopper,
    },
  ];

  const activeDemo = demoReels[activeReelIndex];

  return (
    <div className="space-y-28 pb-24">
      {/* =====================================================================
          1. HERO SECTION: THE GRAND WHITE & AMARANTH PREMIERE
          ===================================================================== */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden pt-6 pb-16">
        {/* Overhead Projector Light Cone: Iris & Light Violet volumetric haze on Alabaster */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[550px] projector-beam-cone pointer-events-none z-0 opacity-70" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-3xl h-[420px] projector-beam-narrow pointer-events-none z-0 opacity-60" />

        {/* Ambient Projector Lens Flares */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-1.5 rounded-full bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] blur-[1px] shadow-glow-amaranth z-10" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-7 pt-4">
          {/* Cinema Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/90 border border-[#CBC3E3] text-[#9F2B68] text-xs sm:text-sm font-bold tracking-wider backdrop-blur-md shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9F2B68] animate-ping" />
            <Film className="w-4 h-4 text-[#9F2B68]" />
            <span className="font-mono uppercase tracking-widest text-[#301934]">OFFICIAL CINEMA INTERVAL PLATFORM</span>
          </div>

          {/* Main Blockbuster Headline */}
          <h1 className="font-cinema text-4xl sm:text-6xl lg:text-7xl font-black text-[#301934] tracking-tight leading-[1.08] drop-shadow-sm">
            Turn The Big Screen <br />
            Into Your <span className="amaranth-metallic-text font-cinema-dec">Grand Premiere</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-[#5E435E] font-medium leading-relaxed">
            Reserve dedicated movie interval intermissions across premier laser theatres.
            Broadcast proposals, milestone celebrations, and brand showcases in full 4K glory.
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/book"
              className="btn-cinema-shimmer w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:from-[#BA3E7F] hover:to-[#7A60DE] shadow-xl shadow-[#9F2B68]/30 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-white" />
              Book An Interval Now
            </Link>
            <Link
              to="/theatres"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-[#301934] bg-white hover:bg-[#F3F3FD] border-2 border-[#CBC3E3] hover:border-[#9F2B68] transition-all duration-200 shadow-sm"
            >
              <Building2 className="w-5 h-5 text-[#9F2B68]" />
              Explore Auditoriums
            </Link>
          </div>

          {/* ===============================================================
              CURVED SILVER SCREEN WITH THEATRE AUDIENCE
              =============================================================== */}
          <div className="pt-8 w-full max-w-4xl mx-auto relative">
            {/* Top Anamorphic Flare Line: Amaranth & Iris */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#9F2B68] to-transparent blur-[1px] opacity-75 mb-1" />

            {/* The Curved Silver Screen Body */}
            <div className="silver-screen-curved bg-white border-2 border-[#CBC3E3] p-4 sm:p-8 relative overflow-hidden shadow-2xl">
              {/* Screen Top Bar / Projector Info */}
              <div className="flex items-center justify-between text-[11px] font-mono text-[#5E435E] mb-4 pb-2 border-b border-[#E6E6FA]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#9F2B68] animate-pulse" />
                  <span className="text-[#301934] font-bold tracking-wider uppercase">
                    INTERMISSION PROJECTION SIMULATOR
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#9F2B68] font-bold">{activeDemo.badge}</span>
                  <span className="hidden sm:inline text-[#AA98A9]">•</span>
                  <span className="hidden sm:inline font-semibold">{activeDemo.theatre}</span>
                </div>
              </div>

              {/* Screen Aspect Ratio Box displaying current moment */}
              <div
                className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br ${activeDemo.bgGradient} p-6 sm:p-10 flex flex-col items-center justify-center text-center border border-white/20 shadow-2xl transition-all duration-700 aspect-video sm:aspect-[21/9]`}
              >
                {/* Vignette and Lens Flare Overlay */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/25 to-black/60 pointer-events-none" />

                {/* Animated Projector Dust & Flare */}
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#CF9FFF]/20 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-3">
                  <span className="inline-block px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest bg-white/20 text-white border border-white/40 backdrop-blur-md">
                    {activeDemo.category}
                  </span>

                  <h2 className={`font-cinema text-xl sm:text-3xl md:text-4xl font-extrabold ${activeDemo.textColor} tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] max-w-2xl px-2`}>
                    "{activeDemo.title}"
                  </h2>

                  <div className="flex items-center justify-center gap-3 pt-2 text-[11px] sm:text-xs text-white/90 font-medium">
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/20">4K LASER 24FPS</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded bg-black/40 border border-white/20">DOLBY ATMOS 7.1</span>
                    <span>•</span>
                    <span className="text-[#CF9FFF] font-bold">Exclusive 1-Slot Window</span>
                  </div>
                </div>

                {/* Screen Selector Dots */}
                <div className="absolute bottom-3 flex items-center gap-2 z-20">
                  {demoReels.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReelIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeReelIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Silhouetted Cinema Auditorium Seats Foreground */}
              <div className="mt-4 pt-3 flex justify-center items-end gap-1.5 sm:gap-3 opacity-80 pointer-events-none select-none">
                {[...Array(11)].map((_, i) => (
                  <div
                    key={i}
                    className="w-6 sm:w-10 h-5 sm:h-7 rounded-t-lg bg-gradient-to-t from-[#301934] via-[#483248] to-[#702963] border-t border-[#AA98A9]/50 shadow-md relative"
                  >
                    <div className="w-full h-1 bg-[#9F2B68]/40 rounded-t-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Technical Guarantee Badges */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm">
              <span className="block text-lg font-bold text-[#9F2B68] font-mono">100% LOCK</span>
              <span className="text-xs text-[#5E435E] font-medium">Single slot acceptance rule</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm">
              <span className="block text-lg font-bold text-[#5D3FD3] font-mono">AES-256</span>
              <span className="text-xs text-[#5E435E] font-medium">Military-grade media privacy</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm">
              <span className="block text-lg font-bold text-[#BF40BF] font-mono">4K LASER</span>
              <span className="text-xs text-[#5E435E] font-medium">True cinema digital mastering</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#CBC3E3] shadow-sm">
              <span className="block text-lg font-bold text-[#800020] font-mono">LIVE PREVIEW</span>
              <span className="text-xs text-[#5E435E] font-medium">Instant auditorium mockup</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. INFINITE 35MM MARQUEE TICKER TAPE IN LAVENDER & AMARANTH
          ===================================================================== */}
      <div className="w-full bg-[#E6E6FA] border-y border-[#CBC3E3] py-3 overflow-hidden shadow-sm relative">
        <div className="flex items-center gap-8 whitespace-nowrap animate-marquee text-xs font-mono tracking-widest text-[#9F2B68] font-bold">
          <span>★ NOW BOOKING INTERVALS</span>
          <span className="text-[#AA98A9]">///</span>
          <span className="text-[#5D3FD3]">4K LASER MASTERING</span>
          <span className="text-[#AA98A9]">///</span>
          <span className="text-[#800020]">EXCLUSIVE ATOMIC SLOT PROTECTION</span>
          <span className="text-[#AA98A9]">///</span>
          <span>MARRIAGE PROPOSALS • BIRTHDAYS • CORPORATE BROADCASTS</span>
          <span className="text-[#AA98A9]">///</span>
          <span className="text-[#BF40BF]">PVR • INOX • CINEPOLIS • SPI CINEMAS</span>
          <span className="text-[#AA98A9]">///</span>
          <span>DIRECTOR PREVIEW SYSTEM</span>
          <span className="text-[#AA98A9]">///</span>
          <span className="text-[#702963]">AES-256-GCM ENCRYPTED</span>
        </div>
      </div>

      {/* =====================================================================
          3. INTERACTIVE LIVE CINEMA STUDIO PLAYGROUND
          ===================================================================== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border-2 border-[#CBC3E3] p-6 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#E6E6FA]">
            <div>
              <span className="text-xs text-[#9F2B68] font-mono uppercase tracking-[0.2em] font-bold">
                DIRECTOR'S PLAYGROUND
              </span>
              <h2 className="font-cinema text-2xl sm:text-4xl font-bold text-[#301934] mt-1">
                Test Your Big Screen Message
              </h2>
              <p className="text-[#5E435E] text-sm mt-1 max-w-xl font-medium">
                Type your message below and preview how your interval projection looks under theatrical anamorphic lighting.
              </p>
            </div>

            {/* Quick Aspect Toggle */}
            <div className="flex items-center gap-2 bg-[#F3F3FD] p-1.5 rounded-2xl border border-[#CBC3E3] text-xs">
              <span className="text-[#5E435E] px-2 font-mono text-[11px] font-bold">Format:</span>
              <button
                type="button"
                onClick={() => setStudioAspect('2.39:1')}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  studioAspect === '2.39:1'
                    ? 'bg-[#9F2B68] text-white shadow-md'
                    : 'text-[#483248] hover:text-[#9F2B68]'
                }`}
              >
                2.39:1 Cinemascope
              </button>
              <button
                type="button"
                onClick={() => setStudioAspect('16:9')}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  studioAspect === '16:9'
                    ? 'bg-[#9F2B68] text-white shadow-md'
                    : 'text-[#483248] hover:text-[#9F2B68]'
                }`}
              >
                16:9 Standard
              </button>
            </div>
          </div>

          {/* Interactive Screen Preview Container */}
          <div className="space-y-6">
            <div
              className={`w-full rounded-2xl bg-gradient-to-br from-[#301934] via-[#702963] to-[#9F2B68] border-2 border-[#CBC3E3] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl transition-all duration-300 ${
                studioAspect === '2.39:1' ? 'min-h-[260px]' : 'min-h-[320px]'
              }`}
            >
              {/* Projector beam highlight */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-white/20 via-[#CF9FFF]/10 to-transparent pointer-events-none" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#DA70D6]/40 to-transparent pointer-events-none" />

              <span className="relative z-10 inline-block px-4 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest bg-white/20 text-white border border-white/40 mb-3 shadow-md backdrop-blur-md">
                {studioCategory.replace(/_/g, ' ')}
              </span>

              <h3 className="relative z-10 font-cinema text-2xl sm:text-4xl lg:text-5xl font-black text-white max-w-3xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] tracking-wide">
                {customStudioText.trim() || 'Enter your custom message below...'}
              </h3>

              <div className="relative z-10 mt-5 flex items-center gap-3 text-xs text-[#E6E6FA] font-mono font-semibold">
                <span>IMAX LASER PROJECTION</span>
                <span>•</span>
                <span className="text-[#DA70D6]">INTERVAL INTERMISSION LIVE</span>
              </div>
            </div>

            {/* Input Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-mono font-bold text-[#9F2B68] uppercase tracking-wider mb-2">
                  Edit Message Text
                </label>
                <input
                  type="text"
                  value={customStudioText}
                  onChange={(e) => setCustomStudioText(e.target.value)}
                  placeholder="e.g., Happy 25th Birthday Rhea! Love from the gang."
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] text-sm transition-all shadow-inner font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-[#9F2B68] uppercase tracking-wider mb-2">
                  Category Style
                </label>
                <select
                  value={studioCategory}
                  onChange={(e) => setStudioCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-[#301934] focus:outline-none focus:border-[#9F2B68] text-sm transition-all font-medium"
                >
                  <option value="MARRIAGE_PROPOSAL">Marriage Proposal</option>
                  <option value="LOVE_PROPOSAL">Love Confession</option>
                  <option value="BIRTHDAY">Birthday Wishes</option>
                  <option value="ADVERTISEMENT">Commercial Ad</option>
                  <option value="CELEBRATION">Anniversary & Milestone</option>
                  <option value="PROMOTION">Event & Campus Promo</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Link
                to={`/book?category=${studioCategory}`}
                className="btn-cinema-shimmer inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#9F2B68]/25 hover:shadow-glow-amaranth transition-all"
              >
                Take this to Booking <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. THE 6-REEL JOURNEY (HOW IT WORKS)
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
            THE PRODUCTION PIPELINE
          </span>
          <h2 className="font-cinema text-3xl sm:text-5xl font-bold text-[#301934]">
            The 6-Reel Journey
          </h2>
          <p className="text-[#5E435E] text-sm max-w-xl mx-auto font-medium">
            From picking your favorite auditorium to watching eyes light up as your moment illuminates the silver screen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative group p-7 rounded-3xl cinema-card-ambient transition-all duration-300 hover:-translate-y-1"
              >
                {/* 35mm Perforation holes on top of card */}
                <div className="h-2 film-sprockets-horizontal opacity-30 mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] flex items-center justify-center text-[#9F2B68] group-hover:scale-110 group-hover:bg-[#9F2B68] group-hover:text-white transition-all shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-marquee text-2xl tracking-widest text-[#9F2B68]/40 group-hover:text-[#9F2B68] transition-colors font-bold">
                    {s.reel}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#301934] mb-2 group-hover:text-[#9F2B68] transition-colors font-cinema">
                  {s.title}
                </h3>
                <p className="text-sm text-[#5E435E] leading-relaxed font-medium">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5. THEATRICAL CATEGORIES (CREATIVE AMARANTH & ROYAL PALETTE)
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
            CHOOSE YOUR MOMENT
          </span>
          <h2 className="font-cinema text-3xl sm:text-5xl font-bold text-[#301934]">
            Theatrical Categories
          </h2>
          <p className="text-[#5E435E] text-sm max-w-xl mx-auto font-medium">
            Every moment is calibrated with specialized auditorium aspect ratios, color mastering, and audio cues.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (
            <Link
              to={`/book?category=${c.id}`}
              key={c.id}
              className={`p-7 rounded-3xl bg-gradient-to-br ${c.color} border-2 transition-all duration-300 group hover:scale-[1.02] ${c.glow} flex flex-col justify-between shadow-sm hover:shadow-xl`}
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-4xl p-3 rounded-2xl bg-white border border-[#CBC3E3] inline-block shadow-sm">
                    {c.icon}
                  </span>
                  {c.badge && (
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full ${c.badgeColor} shadow-sm`}>
                      {c.badge}
                    </span>
                  )}
                </div>

                <span className="block text-[11px] font-mono text-[#9F2B68] font-bold tracking-wider uppercase">
                  {c.tagline}
                </span>
                <h3 className="text-xl font-bold text-[#301934] group-hover:text-[#9F2B68] transition-colors mt-0.5 font-cinema">
                  {c.title}
                </h3>
                <p className="text-sm text-[#5E435E] mt-2.5 leading-relaxed font-medium">{c.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#CBC3E3]/60 flex items-center justify-between text-xs font-bold text-[#9F2B68] group-hover:text-[#5D3FD3]">
                <span className="tracking-wider uppercase">Reserve Interval</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* =====================================================================
          6. FEATURED THEATRES
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 pb-4 border-b border-[#CBC3E3]">
          <div>
            <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
              PREMIER AUDITORIUM ROSTER
            </span>
            <h2 className="font-cinema text-3xl sm:text-4xl font-bold text-[#301934] mt-1">
              Featured Cinemas
            </h2>
            <p className="text-[#5E435E] text-sm mt-1 font-medium">
              Equipped with Christie/Barco laser digital projectors and dedicated intermission playout controllers.
            </p>
          </div>
          <Link
            to="/theatres"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9F2B68] hover:text-[#5D3FD3] transition-colors"
          >
            All Auditoriums <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-white animate-pulse border border-[#CBC3E3]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {theatres.map((t) => (
              <div
                key={t.id}
                className="rounded-3xl cinema-card-ambient overflow-hidden group hover:border-[#9F2B68] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl"
              >
                <Link to={`/theatres/${t.id}`} className="block">
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80'}
                      alt={t.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white/90 backdrop-blur-md text-[#9F2B68] border border-[#CBC3E3] shadow-sm">
                      {t.city}
                    </span>
                    <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#5D3FD3] text-white shadow-md">
                      DCI CERTIFIED
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-xl font-bold text-[#301934] group-hover:text-[#9F2B68] transition-colors font-cinema">
                      {t.name}
                    </h3>
                    <p className="text-xs text-[#5E435E] flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-[#9F2B68]" />
                      {t.location}
                    </p>
                    <p className="text-xs text-[#5E435E] line-clamp-2 leading-relaxed font-medium">{t.description}</p>
                  </div>
                </Link>

                <div className="p-6 pt-0">
                  <div className="pt-4 flex items-center justify-between border-t border-[#E6E6FA]">
                    <span className="text-xs text-[#5E435E] font-mono font-semibold">
                      {t.screen_count || 3} Laser Screens
                    </span>
                    <Link
                      to={`/theatres/${t.id}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#E6E6FA] hover:bg-[#9F2B68] hover:text-white text-[#9F2B68] border border-[#CBC3E3] transition-all uppercase tracking-wider"
                    >
                      Showtimes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* =====================================================================
          7. UPCOMING SHOWTIMES & INTERVAL SLOTS
          ===================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 pb-4 border-b border-[#CBC3E3]">
          <div>
            <span className="text-xs text-[#9F2B68] font-mono font-bold uppercase tracking-[0.25em]">
              CURRENT CINEMA INTERMISSIONS
            </span>
            <h2 className="font-cinema text-3xl sm:text-4xl font-bold text-[#301934] mt-1">
              Available Showtimes
            </h2>
            <p className="text-[#5E435E] text-sm mt-1 font-medium">
              Grab your interval slot before other bookings lock the intermission exclusively.
            </p>
          </div>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#9F2B68] hover:text-[#5D3FD3] transition-colors"
          >
            All Movies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shows.map((s) => (
            <div
              key={s.id}
              className="rounded-3xl cinema-card-ambient p-4 space-y-4 hover:border-[#9F2B68] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl"
            >
              <div className="space-y-3">
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#F3F3FD] border border-[#CBC3E3] shadow-sm">
                  <img
                    src={s.movie_poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80'}
                    alt={s.movie_title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    {s.is_interval_booked ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#800020] text-white shadow-md">
                        LOCKED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-[#9F2B68] text-white shadow-md">
                        SLOT OPEN
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#301934] text-base leading-tight line-clamp-1 font-cinema">
                    {s.movie_title}
                  </h4>
                  <p className="text-xs text-[#9F2B68] font-bold mt-1">{s.theatre_name}</p>
                  <p className="text-[11px] text-[#5E435E] font-mono font-medium">{s.screen_name}</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-xs space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[#483248]">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#9F2B68]" />
                      {s.show_date}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#301934]">
                      <Clock className="w-3.5 h-3.5 text-[#9F2B68]" />
                      {s.start_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#9F2B68] pt-1.5 border-t border-[#E6E6FA]">
                    <span className="font-medium">Intermission:</span>
                    <span className="font-bold">{s.interval_start} - {s.interval_end}</span>
                  </div>
                </div>
              </div>

              <Link
                to={s.is_interval_booked ? '#' : `/book?showId=${s.id}`}
                className={`w-full py-3 rounded-2xl text-xs font-mono font-bold text-center flex items-center justify-center gap-1.5 transition-all uppercase tracking-wider ${
                  s.is_interval_booked
                    ? 'bg-[#E6E6FA] text-[#AA98A9] cursor-not-allowed'
                    : 'btn-cinema-shimmer bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:from-[#BA3E7F] hover:to-[#7A60DE] text-white shadow-lg shadow-[#9F2B68]/20'
                }`}
              >
                {s.is_interval_booked ? 'Slot Reserved' : 'Book Interval'}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
