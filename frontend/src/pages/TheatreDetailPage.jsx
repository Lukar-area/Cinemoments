import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { MapPin, Building2, Calendar, Clock, Film, ArrowLeft, Tv, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { ChatDrawerModal } from '../components/ChatDrawerModal.jsx';
export const TheatreDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [theatre, setTheatre] = useState(null);
    const [screens, setScreens] = useState([]);
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);
    useEffect(() => {
        async function loadDetails() {
            if (!id)
                return;
            try {
                const res = await api.theatres.getById(parseInt(id, 10));
                setTheatre(res.theatre);
                setScreens(res.screens);
                setShows(res.shows);
            }
            catch (err) {
                console.error('Failed to load theatre details:', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadDetails();
    }, [id]);
    if (loading) {
        return (<div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-cinema-gold/30 border-t-cinema-gold rounded-full animate-spin mx-auto"/>
        <p className="mt-4 text-sm text-slate-400">Loading theatre details...</p>
      </div>);
    }
    if (!theatre) {
        return (<div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Theatre Not Found</h2>
        <p className="text-slate-400 mt-2 text-sm">The requested cinema could not be located.</p>
        <Link to="/theatres" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cinema-800 text-amber-400 text-sm font-semibold">
          <ArrowLeft className="w-4 h-4"/> Back to Theatres
        </Link>
      </div>);
    }
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Link */}
      <Link to="/theatres" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors">
        <ArrowLeft className="w-4 h-4"/> All Theatres
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-cinema-850 border border-cinema-700/80 shadow-2xl">
        <div className="h-64 sm:h-80 overflow-hidden relative">
          <img src={theatre.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80'} alt={theatre.name} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/60 to-transparent"/>
        </div>

        <div className="p-6 sm:p-10 -mt-20 relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Building2 className="w-3.5 h-3.5"/>
            {theatre.city}
          </div>
          <h1 className="font-cinema text-3xl sm:text-5xl font-black text-white">{theatre.name}</h1>
          <p className="text-sm text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0"/>
            {theatre.address}, {theatre.location}
          </p>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">{theatre.description}</p>
          <div className="pt-2">
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: location } });
                  return;
                }
                setChatOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cinema-gold to-amber-400 text-cinema-950 font-bold text-xs shadow-md shadow-cinema-gold/20 hover:from-amber-400 hover:to-cinema-gold transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Chat with Cinema Staff
            </button>
          </div>
        </div>
      </div>

      {/* Screens Section */}
      <div className="space-y-4">
        <h2 className="font-cinema text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Tv className="w-5 h-5 text-amber-400"/>
          Auditoriums & Screens
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {screens.map((sc) => (<div key={sc.id} className="p-4 rounded-xl bg-cinema-850 border border-cinema-700/70 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{sc.name}</h4>
                <p className="text-xs text-slate-400">{sc.capacity} Luxury Seats</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase bg-cinema-800 text-amber-400 border border-cinema-700">
                {sc.screen_type}
              </span>
            </div>))}
        </div>
      </div>

      {/* Available Shows & Interval Slots */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cinema-700/60 pb-4">
          <div>
            <h2 className="font-cinema text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400"/>
              Scheduled Shows & Interval Intermissions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select an available interval slot below to initiate your booking request.
            </p>
          </div>
        </div>

        {shows.length === 0 ? (<div className="text-center py-16 bg-cinema-850 rounded-2xl border border-cinema-700 text-slate-400">
            No shows scheduled for upcoming dates at this cinema. Check back soon!
          </div>) : (<div className="space-y-4">
            {shows.map((show) => (<div key={show.id} className="p-5 rounded-2xl bg-cinema-850 border border-cinema-700/80 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Movie & Screen Info */}
                <div className="flex items-center gap-4">
                  <img src={show.movie_poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'} alt={show.movie_title} className="w-16 h-24 object-cover rounded-xl shrink-0 shadow-md"/>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{show.movie_title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cinema-800 text-slate-300 font-semibold">
                        {show.rating || 'PG-13'}
                      </span>
                    </div>
                    <p className="text-xs text-amber-400 font-medium">{show.screen_name}</p>
                    <p className="text-xs text-slate-400">
                      Duration: {show.duration || 140} min • {show.language || 'English'}
                    </p>
                  </div>
                </div>

                {/* Show & Interval Timing */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-cinema-900 border border-cinema-800">
                    <span className="block text-[10px] text-slate-400 font-medium">Show Date & Time</span>
                    <span className="font-bold text-white flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400"/>
                      {show.show_date} • {show.start_time}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="block text-[10px] text-amber-400 font-medium">
                      Interval Screening Window
                    </span>
                    <span className="font-bold text-amber-300 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5"/>
                      {show.interval_start} - {show.interval_end}
                    </span>
                  </div>
                </div>

                {/* Status & CTA */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-cinema-800">
                  {show.is_interval_booked ? (<div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                      <XCircle className="w-4 h-4"/>
                      Interval Reserved
                    </div>) : (<div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4"/>
                      Interval Open
                    </div>)}

                  <Link to={show.is_interval_booked ? '#' : `/book?showId=${show.id}`} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${show.is_interval_booked
                    ? 'bg-cinema-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cinema-gold to-amber-400 text-cinema-950 hover:from-amber-400 hover:to-cinema-gold shadow-md shadow-cinema-gold/20'}`}>
                    {show.is_interval_booked ? 'Already Booked' : 'Book This Interval'}
                  </Link>
                </div>
              </div>))}
          </div>)}
      </div>

      <ChatDrawerModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        theatreId={theatre.id}
        theatreName={theatre.name}
      />
    </div>);
};
