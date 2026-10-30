import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Film, Clock, Search, Sparkles, Calendar, Ticket } from 'lucide-react';

export const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMoviesAndShows() {
      try {
        const [movieRes, showRes] = await Promise.all([
          api.movies.getAll(),
          api.shows.getShows(),
        ]);
        setMovies(movieRes?.movies || []);
        setShows(showRes?.shows || []);
      } catch (err) {
        console.error('Failed to load movies data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMoviesAndShows();
  }, []);

  const filteredMovies = (movies || []).filter(
    (m) =>
      (m?.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (m?.genre || '').toLowerCase().includes(search.toLowerCase()) ||
      (m?.language || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#CBC3E3] relative">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6E6FA] border border-[#CBC3E3] text-[#9F2B68] text-xs font-mono font-bold tracking-widest uppercase">
            <Film className="w-3.5 h-3.5 text-[#9F2B68]" />
            CURRENT THEATRICAL RUN
          </div>
          <h1 className="font-cinema text-3xl sm:text-5xl font-black text-[#301934]">
            Now Screening
          </h1>
          <p className="text-[#5E435E] text-sm max-w-xl font-medium">
            Choose a blockbuster feature running at your preferred auditorium and secure its exclusive intermission interval window.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9F2B68] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search movie title, genre, language..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] transition-all shadow-sm font-medium"
          />
        </div>
      </div>

      {/* Movies Catalog */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-96 rounded-3xl bg-white border border-[#CBC3E3] animate-pulse" />
          ))}
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-20 cinema-card-ambient rounded-3xl border border-[#CBC3E3]">
          <Film className="w-12 h-12 text-[#AA98A9] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#301934] font-cinema">No screening features match your search</h3>
          <p className="text-sm text-[#5E435E] mt-1 font-medium">Try another movie title or genre keyword.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredMovies.map((movie) => {
            const movieShows = (shows || []).filter((s) => {
              const mid = s.movie_id?._id?.toString() || s.movie_id?.toString() || s.movie_id;
              const targetMid = movie.id?.toString() || movie._id?.toString();
              return mid === targetMid;
            });
            return (
              <div
                key={movie.id}
                className="rounded-3xl cinema-card-ambient p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
              >
                {/* 35mm Film Sprockets running horizontally on card top */}
                <div className="h-2.5 film-sprockets-horizontal opacity-30 -mt-2 mb-4" />

                <div className="flex flex-col md:flex-row gap-7 items-start">
                  <div className="relative w-full sm:w-52 h-72 rounded-2xl overflow-hidden shrink-0 border border-[#CBC3E3] shadow-md bg-[#F8F6FC]">
                    <img
                      src={movie.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <span className="absolute bottom-2.5 left-2.5 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-white/90 text-[#9F2B68] border border-[#CBC3E3] shadow-sm">
                      4K DCI
                    </span>
                  </div>

                  <div className="space-y-3.5 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-cinema text-2xl sm:text-3xl font-black text-[#301934] group-hover:text-[#9F2B68] transition-colors">
                        {movie.title}
                      </h2>
                      <span className="text-xs px-3.5 py-1 rounded-full bg-[#E6E6FA] text-[#9F2B68] font-mono font-bold border border-[#CBC3E3] shadow-sm">
                        {movie.rating}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5E435E] font-mono font-medium">
                      <span className="text-[#9F2B68] font-bold uppercase">{movie.genre}</span>
                      <span>•</span>
                      <span>Run Time: {movie.duration} mins</span>
                      <span>•</span>
                      <span>Format: {movie.language} (Dolby Atmos)</span>
                    </div>

                    <p className="text-sm text-[#483248] leading-relaxed max-w-3xl font-medium">
                      {movie.description}
                    </p>
                  </div>
                </div>

                {/* Available Intermissions for this Feature */}
                <div className="border-t border-[#E6E6FA] pt-6 space-y-4">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#9F2B68] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#9F2B68]" />
                    Available Interval Slots for this Movie
                  </h4>

                  {movieShows.length === 0 ? (
                    <p className="text-xs text-[#AA98A9] italic font-mono">
                      No showtimes currently scheduled for this feature today. Check back tomorrow.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {movieShows.map((show) => (
                        <div
                          key={show.id}
                          className="p-4 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] hover:border-[#9F2B68] transition-all flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="space-y-1 font-mono text-xs">
                            <span className="block font-bold text-[#301934] text-sm line-clamp-1 font-cinema">
                              {show.theatre_name}
                            </span>
                            <span className="block text-[11px] text-[#5E435E]">
                              {show.screen_name} • {show.show_date}
                            </span>
                            <span className="block text-[11px] text-[#9F2B68] font-bold">
                              Interval: {show.interval_start} - {show.interval_end}
                            </span>
                          </div>

                          <Link
                            to={show.is_interval_booked ? '#' : `/book?theatreId=${show.theatre_id}&movieId=${movie.id}&showId=${show.id}`}
                            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold shrink-0 transition-all uppercase tracking-wider ${
                              show.is_interval_booked
                                ? 'bg-[#E6E6FA] text-[#AA98A9] cursor-not-allowed'
                                : 'btn-cinema-shimmer bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white shadow-md shadow-[#9F2B68]/20'
                            }`}
                          >
                            {show.is_interval_booked ? 'Booked' : 'Reserve'}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
