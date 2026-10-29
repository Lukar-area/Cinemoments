import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import {
  MapPin,
  Building2,
  Calendar,
  Clock,
  Film,
  ArrowLeft,
  Tv,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
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
      if (!id) return;
      try {
        const res = await api.theatres.getById(parseInt(id, 10));
        setTheatre(res.theatre);
        setScreens(res.screens);
        setShows(res.shows);
      } catch (err) {
        console.error('Failed to load theatre details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-[#CBC3E3] border-t-[#9F2B68] rounded-full animate-spin mx-auto shadow-sm" />
        <p className="mt-4 text-xs font-mono tracking-widest uppercase text-[#5E435E] font-bold">Loading Auditorium Specs...</p>
      </div>
    );
  }

  if (!theatre) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-[#301934] font-cinema">Auditorium Not Found</h2>
        <p className="text-[#5E435E] mt-2 text-sm font-medium">The requested cinema could not be located in our directory.</p>
        <Link
          to="/theatres"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] text-[#9F2B68] text-xs font-mono font-bold uppercase tracking-wider hover:bg-[#9F2B68] hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Partner Cinemas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Link */}
      <Link
        to="/theatres"
        className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#5E435E] hover:text-[#9F2B68] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Auditoriums
      </Link>

      {/* Hero Auditorium Marquee Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white border-2 border-[#CBC3E3] shadow-xl">
        <div className="h-72 sm:h-96 overflow-hidden relative">
          <img
            src={theatre.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&q=80'}
            alt={theatre.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        <div className="p-6 sm:p-10 -mt-24 relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-white text-[#9F2B68] border border-[#CBC3E3] uppercase tracking-widest shadow-sm">
              <Building2 className="w-3.5 h-3.5" />
              {theatre.city}
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-[#5D3FD3] text-white uppercase tracking-widest shadow-md">
              4K LASER AUDITORIUM
            </span>
          </div>

          <h1 className="font-cinema text-3xl sm:text-5xl font-black text-white drop-shadow-md">
            {theatre.name}
          </h1>

          <p className="text-sm text-white/90 flex items-center gap-2 font-medium">
            <MapPin className="w-4 h-4 text-[#CF9FFF] shrink-0" />
            {theatre.address}, {theatre.location}
          </p>

          <p className="text-sm text-[#483248] max-w-3xl leading-relaxed font-medium bg-[#FAFAFE] p-4 rounded-2xl border border-[#CBC3E3]">
            {theatre.description}
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: location } });
                  return;
                }
                setChatOpen(true);
              }}
              className="btn-cinema-shimmer inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 hover:shadow-glow-amaranth transition-all"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              Chat with Cinema Projection Staff
            </button>
          </div>
        </div>
      </div>

      {/* Auditoriums & Screen Hardware */}
      <div className="space-y-4">
        <h2 className="font-cinema text-xl sm:text-2xl font-bold text-[#301934] flex items-center gap-2.5">
          <Tv className="w-5 h-5 text-[#9F2B68]" />
          Auditoriums & Laser Screen Specs
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {screens.map((sc) => (
            <div
              key={sc.id}
              className="p-5 rounded-2xl cinema-card-ambient flex items-center justify-between shadow-sm"
            >
              <div>
                <h4 className="text-sm font-bold text-[#301934] font-cinema">{sc.name}</h4>
                <p className="text-xs text-[#5E435E] font-mono mt-0.5">{sc.capacity} Luxury Seats</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-[#E6E6FA] text-[#9F2B68] border border-[#CBC3E3]">
                {sc.screen_type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Available Shows & Interval Slots */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBC3E3] pb-4">
          <div>
            <h2 className="font-cinema text-xl sm:text-2xl font-bold text-[#301934] flex items-center gap-2.5">
              <Film className="w-5 h-5 text-[#9F2B68]" />
              Scheduled Screenings & Intermission Slots
            </h2>
            <p className="text-xs sm:text-sm text-[#5E435E] mt-1 font-medium">
              Select an available interval window below to lock your booking exclusively.
            </p>
          </div>
        </div>

        {shows.length === 0 ? (
          <div className="text-center py-16 cinema-card-ambient rounded-3xl border border-[#CBC3E3] text-[#AA98A9] font-mono text-xs">
            No shows scheduled for upcoming dates at this cinema. Check back soon.
          </div>
        ) : (
          <div className="space-y-4">
            {shows.map((show) => (
              <div
                key={show.id}
                className="p-5 rounded-2xl cinema-card-ambient hover:border-[#9F2B68] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md"
              >
                {/* Movie & Screen Info */}
                <div className="flex items-center gap-4">
                  <img
                    src={show.movie_poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'}
                    alt={show.movie_title}
                    className="w-16 h-24 object-cover rounded-2xl shrink-0 shadow-md border border-[#CBC3E3]"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#301934] font-cinema">{show.movie_title}</h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-[#E6E6FA] text-[#9F2B68] border border-[#CBC3E3] font-bold">
                        {show.rating || 'UA 16+'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9F2B68] font-bold font-mono">{show.screen_name}</p>
                    <p className="text-xs text-[#5E435E] font-medium">
                      Duration: {show.duration || 140} min • {show.language || 'English'}
                    </p>
                  </div>
                </div>

                {/* Show & Interval Timing */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-[#301934] font-mono">
                  <div className="p-3 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3]">
                    <span className="block text-[10px] text-[#5E435E] uppercase font-bold">Show Showtime</span>
                    <span className="font-bold text-[#301934] flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#9F2B68]" />
                      {show.show_date} • {show.start_time}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3]">
                    <span className="block text-[10px] text-[#9F2B68] font-bold uppercase">
                      Intermission Window
                    </span>
                    <span className="font-bold text-[#301934] flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#9F2B68]" />
                      {show.interval_start} - {show.interval_end}
                    </span>
                  </div>
                </div>

                {/* Status & CTA */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-[#E6E6FA]">
                  {show.is_interval_booked ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#800020] font-mono font-bold">
                      <XCircle className="w-4 h-4 text-[#800020]" />
                      Interval Reserved
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#9F2B68] font-mono font-bold">
                      <CheckCircle2 className="w-4 h-4 text-[#9F2B68]" />
                      Interval Open
                    </div>
                  )}

                  <Link
                    to={show.is_interval_booked ? '#' : `/book?showId=${show.id}`}
                    className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all uppercase tracking-wider ${
                      show.is_interval_booked
                        ? 'bg-[#E6E6FA] text-[#AA98A9] cursor-not-allowed'
                        : 'btn-cinema-shimmer bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white shadow-md shadow-[#9F2B68]/20'
                    }`}
                  >
                    {show.is_interval_booked ? 'Already Booked' : 'Book Interval'}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ChatDrawerModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        theatreId={theatre.id}
        theatreName={theatre.name}
      />
    </div>
  );
};
