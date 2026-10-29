import React from 'react';
import { Link } from 'react-router-dom';
import { Film, ShieldCheck, Lock, Heart, Sparkles, Ticket } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-b from-[#F8F6FC] via-[#F2EDFA] to-[#ECE5F6] border-t border-[#CBC3E3] mt-28 overflow-hidden text-[#301934]">
      {/* Top ambient Amaranth flare */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#9F2B68] to-transparent opacity-80" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#CF9FFF]/20 blur-3xl pointer-events-none" />

      {/* 35mm Celluloid Film Sprockets running along top of footer */}
      <div className="h-3 film-sprockets-horizontal opacity-40 border-b border-[#CBC3E3]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-14">
          {/* Brand & Studio Production Col */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] flex items-center justify-center shadow-lg shadow-[#9F2B68]/20 border border-white">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-cinema text-xl font-black tracking-wider amaranth-metallic-text">
                  CINEMOMENTS
                </span>
                <span className="block text-[9px] text-[#9F2B68] uppercase tracking-[0.2em] font-bold">
                  Official Cinema Interval Network
                </span>
              </div>
            </div>

            <p className="text-sm text-[#5E435E] max-w-md leading-relaxed font-medium">
              Transforming standard cinema movie intervals into unforgettable big-screen moments.
              Project marriage proposals, love surprises, celebratory milestones, and high-impact commercial broadcasts across premier multiplex auditoriums in pristine 4K laser.
            </p>

            {/* Cinema Tech Specs / Badges */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#E6E6FA] text-[#9F2B68] border border-[#CBC3E3] shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-[#9F2B68]" />
                4K DCI LASER
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#E6E6FA] text-[#5D3FD3] border border-[#CBC3E3] shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5D3FD3]" />
                AES-256-GCM ENCRYPTED
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#E6E6FA] text-[#800020] border border-[#CBC3E3] shadow-sm">
                <Lock className="w-3.5 h-3.5 text-[#800020]" />
                ATOMIC 1-SLOT LOCK
              </span>
            </div>
          </div>

          {/* Quick Links Navigation */}
          <div>
            <h4 className="font-cinema text-xs font-bold text-[#9F2B68] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5 text-[#9F2B68]" />
              Theatrical Roster
            </h4>
            <ul className="space-y-3 text-sm text-[#5E435E] font-medium">
              <li>
                <Link to="/theatres" className="hover:text-[#9F2B68] transition-colors flex items-center gap-2">
                  <span className="text-[#9F2B68]">›</span> Partner Auditoriums
                </Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-[#9F2B68] transition-colors flex items-center gap-2">
                  <span className="text-[#9F2B68]">›</span> Current Screenings
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-[#9F2B68] transition-colors flex items-center gap-2">
                  <span className="text-[#9F2B68]">›</span> Reserve Interval Slot
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#9F2B68] transition-colors flex items-center gap-2">
                  <span className="text-[#9F2B68]">›</span> Ticket Passes & Invoices
                </Link>
              </li>
            </ul>
          </div>

          {/* Moments & Categories */}
          <div>
            <h4 className="font-cinema text-xs font-bold text-[#9F2B68] tracking-[0.2em] uppercase mb-4">
              Featured Moments
            </h4>
            <ul className="space-y-2.5 text-sm text-[#5E435E] font-medium">
              <li className="flex items-center gap-2.5 hover:text-[#9F2B68] transition-colors">
                <span className="text-base">💍</span> Marriage Proposals
              </li>
              <li className="flex items-center gap-2.5 hover:text-[#9F2B68] transition-colors">
                <span className="text-base">❤️</span> Love Confessions
              </li>
              <li className="flex items-center gap-2.5 hover:text-[#9F2B68] transition-colors">
                <span className="text-base">🎂</span> Blockbuster Birthdays
              </li>
              <li className="flex items-center gap-2.5 hover:text-[#9F2B68] transition-colors">
                <span className="text-base">📢</span> Brand Intermissions
              </li>
              <li className="flex items-center gap-2.5 hover:text-[#9F2B68] transition-colors">
                <span className="text-base">🎉</span> Golden Anniversaries
              </li>
            </ul>
          </div>
        </div>

        {/* Theatrical End Credits Banner */}
        <div className="mt-14 pt-8 border-t border-[#CBC3E3] flex flex-col sm:flex-row items-center justify-between text-xs text-[#702963] gap-4">
          <div className="flex items-center gap-3">
            <span className="font-marquee text-lg tracking-widest text-[#301934] uppercase font-bold">
              A CINEMOMENTS PRODUCTION
            </span>
            <span className="text-[#CBC3E3]">•</span>
            <span className="font-mono">© {new Date().getFullYear()} All Screen Rights Reserved</span>
          </div>

          <p className="flex items-center gap-1.5 text-[#5E435E] font-medium">
            Crafted for <Heart className="w-3.5 h-3.5 text-[#9F2B68] fill-[#9F2B68] inline animate-pulse" /> unforgettable moments on the silver screen.
          </p>
        </div>
      </div>
    </footer>
  );
};
