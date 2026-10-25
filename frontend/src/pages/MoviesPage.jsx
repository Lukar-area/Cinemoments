import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Film, Clock, Search } from 'lucide-react';
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
                setMovies(movieRes.movies);
                setShows(showRes.shows);
            }
            catch (err) {
                console.error('Failed to load movies data:', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadMoviesAndShows();
    }, []);
    const filteredMovies = movies.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.genre.toLowerCase().includes(search.toLowerCase()) ||
        m.language.toLowerCase().includes(search.toLowerCase()));
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-cinema-700/60">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Currently Screening
          </span>
          <h1 className="font-cinema text-3xl sm:text-5xl font-bold text-white mt-1">
            Browse Movies
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Choose a movie showing at your local cinema and book its intermission to surprise
            someone or broadcast your message.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, genre, language..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"/>
        </div>
      </div>

      {/* Movies List */}
      {loading ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (<div key={i} className="h-96 rounded-2xl bg-cinema-850 animate-pulse"/>))}
        </div>) : filteredMovies.length === 0 ? (<div className="text-center py-20 bg-cinema-850 rounded-2xl border border-cinema-700">
          <Film className="w-12 h-12 text-slate-500 mx-auto mb-3"/>
          <h3 className="text-lg font-bold text-white">No movies matched your search</h3>
          <p className="text-sm text-slate-400 mt-1">Try another search keyword.</p>
        </div>) : (<div className="space-y-12">
          {filteredMovies.map((movie) => {
                const movieShows = shows.filter((s) => s.movie_id === movie.id);
                return (<div key={movie.id} className="rounded-3xl bg-cinema-850 border border-cinema-700/80 p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <img src={movie.poster || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80'} alt={movie.title} className="w-full sm:w-48 h-64 object-cover rounded-2xl shadow-lg shrink-0"/>
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-cinema text-2xl sm:text-3xl font-bold text-white">
                        {movie.title}
                      </h2>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-cinema-800 text-amber-300 font-bold border border-amber-500/30">
                        {movie.rating}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="text-amber-400 font-medium">{movie.genre}</span>
                      <span>•</span>
                      <span>Duration: {movie.duration} mins</span>
                      <span>•</span>
                      <span>Language: {movie.language}</span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {movie.description}
                    </p>
                  </div>
                </div>

                {/* Showtimes & Available Interval Slots for this Movie */}
                <div className="border-t border-cinema-700/60 pt-6 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400"/>
                    Available Interval Showtimes
                  </h4>

                  {movieShows.length === 0 ? (<p className="text-xs text-slate-500 italic">
                      No showtimes currently scheduled for this movie.
                    </p>) : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {movieShows.map((show) => (<div key={show.id} className="p-3.5 rounded-xl bg-cinema-900/90 border border-cinema-800 hover:border-amber-500/30 transition-all flex items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="block text-xs font-bold text-white line-clamp-1">
                              {show.theatre_name}
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {show.screen_name} • {show.show_date}
                            </span>
                            <span className="block text-[11px] text-amber-400 font-semibold">
                              Interval: {show.interval_start} - {show.interval_end}
                            </span>
                          </div>

                          <Link to={show.is_interval_booked ? '#' : `/book?showId=${show.id}`} className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${show.is_interval_booked
                                ? 'bg-cinema-800 text-slate-500 cursor-not-allowed'
                                : 'bg-cinema-gold text-cinema-950 hover:bg-amber-400 shadow-sm'}`}>
                            {show.is_interval_booked ? 'Booked' : 'Book'}
                          </Link>
                        </div>))}
                    </div>)}
                </div>
              </div>);
            })}
        </div>)}
    </div>);
};
