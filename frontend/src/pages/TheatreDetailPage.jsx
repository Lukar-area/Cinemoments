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
  Ticket,
  ArrowRight,
  ShieldCheck,
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
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      if (!id) return;
      try {
        setLoading(true);
        const res = await api.theatres.getById(id);
        setTheatre(res.theatre);
        setScreens(res.screens || []);
        setShows(res.shows || []);
        
        // If API returned movies list, use it; otherwise compute from shows
        if (res.movies && res.movies.length > 0) {
          setMovies(res.movies);
          setSelectedMovieId(res.movies[0]?.id || null);
        } else if (res.shows && res.shows.length > 0) {
          const movieMap = new Map();
          for (const s of res.shows) {
            if (s.movie_id && !movieMap.has(s.movie_id)) {
              movieMap.set(s.movie_id, {
                id: s.movie_id,
                title: s.movie_title,
                poster: s.movie_poster,
                duration: s.duration,
                language: s.language,
                rating: s.rating,
                genre: s.genre,
                upcoming_shows_count: res.shows.filter(item => item.movie_id === s.movie_id).length,
              });
            }
          }
          const movieList = Array.from(movieMap.values());
          setMovies(movieList);
          setSelectedMovieId(movieList[0]?.id || null);
        } else {
          setMovies([]);
          setSelectedMovieId(null);
        }
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

  // Filter shows for currently selected movie
  const selectedMovie = movies.find(m => m.id === selectedMovieId);
  const movieShows = selectedMovieId
    ? shows.filter(s => s.movie_id === selectedMovieId)
    : shows;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back Link */}
      <Link
        to="/theatres"
        className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-[#5E435E] hover:text-[#9F2B68] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> All Partner Cinemas
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
            {theatre.has_active_schedules && (
              <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold bg-[#9F2B68] text-white uppercase tracking-widest shadow-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE BOOKING SCHEDULES
              </span>
            )}
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

          {/* Facilities list */}
          <div className="pt-2">
            <span className="text-xs font-mono font-bold text-[#9F2B68] uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Cinema Facilities & Hardware:
            </span>
            <div className="flex flex-wrap gap-2">
              {(theatre.facilities || [
                '4K Laser Projection',
                'Dolby Atmos Audio',
                'Intermission Playout System',
              ]).map((fac, idx) => (
                <span
                  key={idx}
                  className="text-xs font-mono font-semibold px-3 py-1 rounded-xl bg-white border border-[#CBC3E3] text-[#301934] shadow-sm"
                >
                  {fac}
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <Link
              to={`/book?theatreId=${theatre.id}`}
              className="btn-cinema-shimmer inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 hover:shadow-glow-amaranth transition-all"
            >
              <Ticket className="w-4 h-4 text-white" />
              Book Interval Intermission Here
            </Link>

            <button
              onClick={() => {
                if (!user) {
                  navigate('/login', { state: { from: location } });
                  return;
                }
                setChatOpen(true);
              }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-[#CBC3E3] text-[#301934] hover:text-[#9F2B68] hover:border-[#9F2B68] font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 text-[#9F2B68]" />
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

      {/* Movies Currently Scheduled at this Cinema */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#CBC3E3] pb-4">
          <div>
            <h2 className="font-cinema text-xl sm:text-2xl font-bold text-[#301934] flex items-center gap-2.5">
              <Film className="w-5 h-5 text-[#9F2B68]" />
              Movies Scheduled at this Theatre
            </h2>
            <p className="text-xs sm:text-sm text-[#5E435E] mt-1 font-medium">
              Select a movie below to view its available showtimes and intermission slots.
            </p>
          </div>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-16 cinema-card-ambient rounded-3xl border border-[#CBC3E3] text-[#AA98A9] font-mono text-sm">
            No movies currently available at this theatre.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMovieId(m.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                  selectedMovieId === m.id
                    ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] shadow-md shadow-[#9F2B68]/15'
                    : 'bg-white border-[#CBC3E3] hover:border-[#9F2B68]/50 shadow-sm'
                }`}
              >
                <div>
                  <div className="relative h-56 rounded-xl overflow-hidden mb-3 border border-[#CBC3E3]">
                    <img
                      src={m.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/90 text-[#9F2B68] border border-[#CBC3E3]">
                      {m.rating || 'PG-13'}
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#5D3FD3] text-white">
                      {m.duration} min
                    </span>
                  </div>

                  <h3 className="font-bold text-[#301934] text-base leading-snug font-cinema line-clamp-1">
                    {m.title}
                  </h3>

                  <p className="text-xs text-[#9F2B68] font-semibold mt-1">
                    {m.genre || 'Action / Drama'}
                  </p>

                  <p className="text-xs text-[#5E435E] font-medium mt-0.5">
                    Language: {m.language || 'English'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#CBC3E3] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#5D3FD3]">
                    {m.upcoming_shows_count || 1} Showtimes
                  </span>
                  <button
                    type="button"
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      selectedMovieId === m.id
                        ? 'bg-[#9F2B68] text-white'
                        : 'bg-[#E6E6FA] text-[#702963]'
                    }`}
                  >
                    {selectedMovieId === m.id ? 'Selected' : 'View Shows'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Shows & Interval Slots for Selected Movie */}
      {selectedMovie && (
        <div className="space-y-6 pt-6 border-t border-[#CBC3E3]">
          <div>
            <h2 className="font-cinema text-xl sm:text-2xl font-bold text-[#301934] flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-[#9F2B68]" />
              Available Showtimes & Interval Slots: <span className="text-[#9F2B68]">{selectedMovie.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#5E435E] mt-1 font-medium">
              Review start times and interval windows. Select an available slot to proceed with booking.
            </p>
          </div>

          {movieShows.length === 0 ? (
            <div className="text-center py-12 cinema-card-ambient rounded-3xl border border-[#CBC3E3] text-[#AA98A9] font-mono text-xs">
              No upcoming shows scheduled for {selectedMovie.title} at this cinema.
            </div>
          ) : (
            <div className="space-y-4">
              {movieShows.map((show) => (
                <div
                  key={show.id}
                  className="p-5 rounded-2xl cinema-card-ambient hover:border-[#9F2B68] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md"
                >
                  {/* Movie & Screen Info */}
                  <div className="flex items-center gap-4">
                    <img
                      src={show.movie_poster || selectedMovie.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80'}
                      alt={show.movie_title}
                      className="w-16 h-24 object-cover rounded-2xl shrink-0 shadow-md border border-[#CBC3E3]"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#301934] font-cinema">{show.movie_title}</h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-[#E6E6FA] text-[#9F2B68] border border-[#CBC3E3] font-bold">
                          {show.rating || selectedMovie.rating || 'PG-13'}
                        </span>
                      </div>
                      <p className="text-xs text-[#9F2B68] font-bold font-mono">{show.screen_name}</p>
                      <p className="text-xs text-[#5E435E] font-medium">
                        Duration: {show.duration || selectedMovie.duration || 140} min • {show.language || selectedMovie.language || 'English'}
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
                        {show.interval_start} – {show.interval_end}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#FFF0F7] border border-[#9F2B68]/30">
                      <span className="block text-[10px] text-[#9F2B68] font-bold uppercase">Estimated Rate</span>
                      <span className="font-bold text-[#9F2B68] text-sm mt-0.5">
                        ₹{Number(show.price_estimate || 500).toFixed(2)}
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
                      to={
                        show.is_interval_booked
                          ? '#'
                          : `/book?theatreId=${theatre.id}&movieId=${selectedMovie.id}&showId=${show.id}`
                      }
                      className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all uppercase tracking-wider ${
                        show.is_interval_booked
                          ? 'bg-[#E6E6FA] text-[#AA98A9] cursor-not-allowed'
                          : 'btn-cinema-shimmer bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white shadow-md shadow-[#9F2B68]/20'
                      }`}
                    >
                      {show.is_interval_booked ? 'Already Booked' : 'Book Interval Slot'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ChatDrawerModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        theatreId={theatre.id}
        theatreName={theatre.name}
      />
    </div>
  );
};
