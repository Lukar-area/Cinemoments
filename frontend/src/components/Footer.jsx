import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, Lock, Heart } from 'lucide-react';
export const Footer = () => {
    return (<footer className="bg-cinema-950 border-t border-cinema-700/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cinema-red to-amber-600 flex items-center justify-center">
                <Film className="w-5 h-5 text-white"/>
              </div>
              <span className="font-cinema text-xl font-bold tracking-wider text-amber-400">
                CINEMOMENTS
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Transform cinema intervals into once-in-a-lifetime milestones. Dedicated to marriage
              proposals, heartfelt surprises, birthday wishes, and business promotions on the big
              screen.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cinema-800 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5"/>
                AES-256-GCM Encrypted Media
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cinema-800 text-blue-400 border border-blue-500/20">
                <Lock className="w-3.5 h-3.5"/>
                Atomic Double-Acceptance Prevention
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-cinema text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/theatres" className="hover:text-amber-400 transition-colors">
                  Featured Theatres
                </Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-amber-400 transition-colors">
                  Current Movies
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-amber-400 transition-colors">
                  Book an Interval
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-amber-400 transition-colors">
                  Track My Requests
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-cinema text-sm font-semibold text-slate-200 tracking-wider uppercase mb-4">
              Moments
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span>💍</span> Marriage Proposals
              </li>
              <li className="flex items-center gap-2">
                <span>❤️</span> Love Proposals
              </li>
              <li className="flex items-center gap-2">
                <span>🎂</span> Birthday Wishes
              </li>
              <li className="flex items-center gap-2">
                <span>📢</span> Commercial Advertisements
              </li>
              <li className="flex items-center gap-2">
                <span>🎓</span> College & Campus Events
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-cinema-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CineMoments Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-cinema-red fill-cinema-red inline"/> for unforgettable cinema memories.
          </p>
        </div>
      </div>
    </footer>);
};
