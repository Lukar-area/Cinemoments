import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Building2, MapPin, Search, Film, ArrowRight } from 'lucide-react';
export const TheatresPage = () => {
    const [theatres, setTheatres] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        async function loadTheatres() {
            try {
                const res = await api.theatres.getAll();
                setTheatres(res.theatres);
            }
            catch (err) {
                console.error('Failed to load theatres:', err);
            }
            finally {
                setLoading(false);
            }
        }
        loadTheatres();
    }, []);
    const filteredTheatres = theatres.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.city.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase()));
    return (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-cinema-700/60">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">
            Partner Cinemas
          </span>
          <h1 className="font-cinema text-3xl sm:text-5xl font-bold text-white mt-1">
            Browse Theatres
          </h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Select a theatre equipped with laser digital projection and dedicated intermission audio
            systems for your interval screening.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or city..." className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cinema-850 border border-cinema-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"/>
        </div>
      </div>

      {/* Theatres Grid */}
      {loading ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (<div key={i} className="h-80 rounded-2xl bg-cinema-850 animate-pulse"/>))}
        </div>) : filteredTheatres.length === 0 ? (<div className="text-center py-20 bg-cinema-850 rounded-2xl border border-cinema-700">
          <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3"/>
          <h3 className="text-lg font-bold text-white">No theatres matched your search</h3>
          <p className="text-sm text-slate-400 mt-1">Try a different search keyword or city.</p>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTheatres.map((t) => (<div key={t.id} className="rounded-2xl bg-cinema-850 border border-cinema-700/80 overflow-hidden group hover:border-amber-500/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
              <Link to={`/theatres/${t.id}`} className="block">
                <div className="h-52 overflow-hidden relative">
                  <img src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80'} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-transparent to-transparent"/>
                  <span className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30">
                    {t.city}
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0"/>
                    {t.address}, {t.location}
                  </p>
                  <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                    {t.description}
                  </p>
                </div>
              </Link>

              <div className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-cinema-700/60 pt-4">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400"/>
                    {t.screen_count || 2} Screens
                  </span>
                  <span className="text-emerald-400 font-medium">Interval Projection Ready</span>
                </div>

                <Link to={`/theatres/${t.id}`} className="w-full py-3 rounded-xl text-sm font-semibold bg-cinema-800 hover:bg-gradient-to-r hover:from-cinema-gold hover:to-amber-500 hover:text-cinema-950 text-amber-400 border border-cinema-700 hover:border-transparent transition-all flex items-center justify-center gap-2">
                  View Available Shows <ArrowRight className="w-4 h-4"/>
                </Link>
              </div>
            </div>))}
        </div>)}
    </div>);
};
