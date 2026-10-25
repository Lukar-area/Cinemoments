import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Sparkles, Film, Building2, Calendar, Clock, ArrowRight, PartyPopper, Eye, CheckCircle, } from 'lucide-react';
export const HomePage = () => {
    const [theatres, setTheatres] = useState([]);
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadData() {
            try {
                const [theatresRes, showsRes] = await Promise.all([
                    api.theatres.getAll(),
                    api.shows.getShows(),
                ]);
                setTheatres(theatresRes.theatres.slice(0, 3));
                setShows(showsRes.shows.slice(0, 4));
            }
            catch (err) {
                console.error('Failed to load homepage data:', err);
            }
            finally {
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
            desc: 'Ask the biggest question of your life in front of a cheer-filled auditorium.',
            badge: 'Most Popular',
            color: 'from-amber-500/20 to-cinema-gold/10 border-amber-500/30',
        },
        {
            id: 'LOVE_PROPOSAL',
            title: 'Love Proposal',
            icon: '❤️',
            desc: 'Declare your love with high-definition visuals and sentimental messages.',
            color: 'from-rose-500/20 to-red-500/10 border-rose-500/30',
        },
        {
            id: 'BIRTHDAY',
            title: 'Birthday Wishes',
            icon: '🎂',
            desc: 'Surprise your best friend or family member with a blockbuster birthday shout-out.',
            color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30',
        },
        {
            id: 'ADVERTISEMENT',
            title: 'Commercial Ads',
            icon: '📢',
            desc: 'Hyper-targeted local business promotions to a captive cinema audience.',
            color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
        },
        {
            id: 'CELEBRATION',
            title: 'Celebrations & Anniversaries',
            icon: '🎉',
            desc: 'Celebrate milestone anniversaries and life triumphs where memories last forever.',
            color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30',
        },
        {
            id: 'PROMOTION',
            title: 'College & Event Promo',
            icon: '🏢',
            desc: 'Promote college fests, concerts, hackathons, and regional sports events.',
            color: 'from-orange-500/20 to-yellow-500/10 border-orange-500/30',
        },
    ];
    const steps = [
        {
            num: '01',
            title: 'Choose Theatre',
            desc: 'Select your favorite local cinema hall and preferred screen.',
            icon: Building2,
        },
        {
            num: '02',
            title: 'Select Movie & Show',
            desc: 'Pick the movie showtime and designated interval intermission slot.',
            icon: Film,
        },
        {
            num: '03',
            title: 'Submit Your Content',
            desc: 'Upload high-res photos or videos with your personal message.',
            icon: Sparkles,
        },
        {
            num: '04',
            title: 'Theatre Reviews',
            desc: 'Authorized cinema staff reviews content to ensure cinema standards.',
            icon: Eye,
        },
        {
            num: '05',
            title: 'Get Accepted',
            desc: 'Our atomic system accepts your slot and secures the interval exclusively.',
            icon: CheckCircle,
        },
        {
            num: '06',
            title: 'Your Big Screen Moment',
            desc: 'Watch eyes light up as your moment illuminates the silver screen!',
            icon: PartyPopper,
        },
    ];
    return (<div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-12">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80" alt="Cinema Auditorium" className="w-full h-full object-cover object-center opacity-25 scale-105 transform motion-safe:animate-pulse duration-[10000ms]"/>
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-900/80 to-cinema-950"/>
          <div className="absolute inset-0 cinema-gradient"/>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cinema-800/80 border border-cinema-gold/30 text-cinema-gold text-xs sm:text-sm font-semibold tracking-wide backdrop-blur-md shadow-glow-gold/20">
            <Sparkles className="w-4 h-4 text-amber-400"/>
            Exclusive Interval Screenings Available
          </div>

          <h1 className="font-cinema text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none drop-shadow-2xl">
            Make Your Moment <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-white">
              Unforgettable
            </span>{' '}
            On The Big Screen
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-light leading-relaxed">
            Book a movie interval for marriage proposals, advertisements, birthday surprises, and
            once-in-a-lifetime milestones. Projected in 4K laser projection.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/book" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-cinema-950 bg-gradient-to-r from-cinema-gold via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-cinema-gold shadow-lg shadow-cinema-gold/30 hover:scale-105 transition-all duration-200">
              <Sparkles className="w-5 h-5 text-black"/>
              Book an Interval
            </Link>
            <Link to="/theatres" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-cinema-850 hover:bg-cinema-800 border border-cinema-700 hover:border-cinema-600 transition-all duration-200">
              <Building2 className="w-5 h-5 text-amber-400"/>
              Explore Theatres
            </Link>
          </div>

          {/* Quick stats pills */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
            <div className="p-3 rounded-xl bg-cinema-850/50 border border-cinema-700/50 backdrop-blur-sm">
              <span className="block text-xl font-bold text-amber-400">100% Guaranteed</span>
              <span className="text-xs text-slate-400">Single slot acceptance rule</span>
            </div>
            <div className="p-3 rounded-xl bg-cinema-850/50 border border-cinema-700/50 backdrop-blur-sm">
              <span className="block text-xl font-bold text-emerald-400">AES-256-GCM</span>
              <span className="text-xs text-slate-400">Encrypted personal media</span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-cinema-850/50 border border-cinema-700/50 backdrop-blur-sm">
              <span className="block text-xl font-bold text-sky-400">Live Preview</span>
              <span className="text-xs text-slate-400">Real-time cinema mockup</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Seamless 6-Step Experience
          </span>
          <h2 className="font-cinema text-3xl sm:text-4xl font-bold text-white">How It Works</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From picking your favorite theatre to watching your moment illuminate the silver
            screen, we handle every detail smoothly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (<div key={idx} className="relative group p-6 rounded-2xl bg-cinema-850 border border-cinema-700/80 hover:border-amber-500/40 hover:bg-cinema-800/80 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6"/>
                  </div>
                  <span className="font-cinema text-3xl font-black text-slate-700 group-hover:text-amber-500/30 transition-colors">
                    {s.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>);
        })}
        </div>
      </section>

      {/* Booking Purpose Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Whatever The Occasion
          </span>
          <h2 className="font-cinema text-3xl sm:text-4xl font-bold text-white">
            Booking Categories
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Every category is tailored to maximize the cinematic experience with optimized visual
            templates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c) => (<Link to={`/book?category=${c.id}`} key={c.id} className={`p-6 rounded-2xl bg-gradient-to-br ${c.color} bg-cinema-850 border backdrop-blur-sm hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl p-2 rounded-xl bg-cinema-900/60 inline-block shadow-md">
                  {c.icon}
                </span>
                {c.badge && (<span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {c.badge}
                  </span>)}
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{c.desc}</p>
              <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
                Book this moment <ArrowRight className="w-4 h-4"/>
              </div>
            </Link>))}
        </div>
      </section>

      {/* Featured Theatres */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
              Premier Venues
            </span>
            <h2 className="font-cinema text-3xl font-bold text-white">Featured Theatres</h2>
            <p className="text-slate-400 text-sm mt-1">
              Top multiplexes equipped with laser projection and dedicated interval displays.
            </p>
          </div>
          <Link to="/theatres" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300">
            View All Theatres <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>

        {loading ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (<div key={i} className="h-64 rounded-2xl bg-cinema-850 animate-pulse"/>))}
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {theatres.map((t) => (<div key={t.id} className="rounded-2xl bg-cinema-850 border border-cinema-700/70 overflow-hidden group hover:border-amber-500/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
                <Link to={`/theatres/${t.id}`} className="block">
                  <div className="h-48 overflow-hidden relative">
                    <img src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80'} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-transparent to-transparent"/>
                    <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-slate-200">
                      {t.city}
                    </span>
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">{t.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400"/>
                      {t.location}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                  </div>
                </Link>
                <div className="p-6 pt-0">
                  <div className="pt-3 flex items-center justify-between border-t border-cinema-700/50">
                    <span className="text-xs text-slate-400 font-medium">
                      {t.screen_count || 3} Screens Available
                    </span>
                    <Link to={`/theatres/${t.id}`} className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cinema-800 hover:bg-amber-500 hover:text-black text-amber-400 transition-colors">
                      View Shows
                    </Link>
                  </div>
                </div>
              </div>))}
          </div>)}
      </section>

      {/* Upcoming Shows & Intervals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
              Available Intermissions
            </span>
            <h2 className="font-cinema text-3xl font-bold text-white">Upcoming Shows</h2>
            <p className="text-slate-400 text-sm mt-1">
              Select an upcoming showtime to secure your spot before other requests arrive.
            </p>
          </div>
          <Link to="/movies" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300">
            Explore All Movies <ArrowRight className="w-4 h-4"/>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shows.map((s) => (<div key={s.id} className="rounded-2xl bg-cinema-850 border border-cinema-700/70 p-4 space-y-4 hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-cinema-900">
                  <img src={s.movie_poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&q=80'} alt={s.movie_title} className="w-full h-full object-cover"/>
                  <div className="absolute top-2 right-2">
                    {s.is_interval_booked ? (<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-500/90 text-white shadow-md">
                        Booked
                      </span>) : (<span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/90 text-white shadow-md">
                        Slot Open
                      </span>)}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white text-base leading-tight line-clamp-1">
                    {s.movie_title}
                  </h4>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">{s.theatre_name}</p>
                  <p className="text-[11px] text-slate-400">{s.screen_name}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-cinema-900/80 border border-cinema-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400"/>
                      {s.show_date}
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-400"/>
                      {s.start_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-amber-400/90 pt-1 border-t border-cinema-800 font-medium">
                    <span>Interval Window:</span>
                    <span>{s.interval_start} - {s.interval_end}</span>
                  </div>
                </div>
              </div>

              <Link to={s.is_interval_booked ? '#' : `/book?showId=${s.id}`} className={`w-full py-2.5 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all ${s.is_interval_booked
                ? 'bg-cinema-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cinema-gold to-amber-500 hover:from-amber-400 hover:to-cinema-gold text-cinema-950 shadow-md shadow-cinema-gold/20'}`}>
                {s.is_interval_booked ? 'Slot Taken' : 'Book Interval'}
              </Link>
            </div>))}
        </div>
      </section>
    </div>);
};
