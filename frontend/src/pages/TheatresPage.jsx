import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Building2, MapPin, Search, Film, ArrowRight, Sparkles } from 'lucide-react';

export const TheatresPage = () => {
  const [theatres, setTheatres] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheatres() {
      try {
        const res = await api.theatres.getAll();
        setTheatres(res.theatres);
      } catch (err) {
        console.error('Failed to load theatres:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTheatres();
  }, []);

  const filteredTheatres = theatres.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#CBC3E3]">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6E6FA] border border-[#CBC3E3] text-[#9F2B68] text-xs font-mono font-bold tracking-widest uppercase mb-2">
            <Building2 className="w-3.5 h-3.5 text-[#9F2B68]" />
            PARTNER AUDITORIUM NETWORK
          </div>
          <h1 className="font-cinema text-3xl sm:text-5xl font-black text-[#301934]">
            Partner Cinemas
          </h1>
          <p className="text-[#5E435E] text-sm mt-2 max-w-xl font-medium">
            Choose an auditorium equipped with laser digital projection, dedicated intermission playout controllers, and multi-channel surround audio.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9F2B68] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cinema name or city..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-[#CBC3E3] text-sm text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68] transition-all shadow-sm font-medium"
          />
        </div>
      </div>

      {/* Theatres Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-white animate-pulse border border-[#CBC3E3]" />
          ))}
        </div>
      ) : filteredTheatres.length === 0 ? (
        <div className="text-center py-20 cinema-card-ambient rounded-3xl border border-[#CBC3E3]">
          <Building2 className="w-12 h-12 text-[#AA98A9] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#301934] font-cinema">No partner cinemas match your search</h3>
          <p className="text-sm text-[#5E435E] mt-1 font-medium">Try another search keyword or city.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTheatres.map((t) => (
            <div
              key={t.id}
              className="rounded-3xl cinema-card-ambient overflow-hidden group hover:border-[#9F2B68] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl"
            >
              <Link to={`/theatres/${t.id}`} className="block">
                <div className="h-56 overflow-hidden relative">
                  <img
                    src={t.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80'}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white/95 backdrop-blur-md text-[#9F2B68] border border-[#CBC3E3] shadow-sm">
                    {t.city}
                  </span>
                  <span className="absolute top-3 right-3 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#5D3FD3] text-white shadow-md">
                    LASER 4K
                  </span>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-[#301934] group-hover:text-[#9F2B68] transition-colors font-cinema">
                    {t.name}
                  </h3>
                  <p className="text-xs text-[#5E435E] flex items-center gap-1.5 font-medium">
                    <MapPin className="w-4 h-4 text-[#9F2B68] shrink-0" />
                    {t.address}, {t.location}
                  </p>
                  <p className="text-sm text-[#483248] line-clamp-3 leading-relaxed font-medium">
                    {t.description}
                  </p>
                </div>
              </Link>

              <div className="p-6 pt-0 space-y-4">
                <div className="flex items-center justify-between text-xs text-[#5E435E] border-t border-[#E6E6FA] pt-4 font-mono font-medium">
                  <span className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#9F2B68]" />
                    {t.screen_count || 3} Laser Screens
                  </span>
                  <span className="text-[#9F2B68] font-bold">INTERVAL READY</span>
                </div>

                <Link
                  to={`/theatres/${t.id}`}
                  className="btn-cinema-shimmer w-full py-3 rounded-2xl text-xs font-mono font-bold bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:from-[#BA3E7F] hover:to-[#7A60DE] text-white shadow-md shadow-[#9F2B68]/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  View Available Screenings <ArrowRight className="w-4 h-4 text-white" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
