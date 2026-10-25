import React from 'react';
import { Sparkles, Film } from 'lucide-react';
export const ScreenMockupPreview = ({ message, bookingType, mediaPreviewUrl, mediaType, movieTitle, theatreName, }) => {
    const formatCategory = (type) => {
        return type
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    };
    return (<div className="relative w-full max-w-4xl mx-auto rounded-3xl bg-gradient-to-b from-cinema-950 via-cinema-900 to-black p-4 sm:p-8 border border-cinema-700/80 shadow-2xl overflow-hidden">
      {/* Ambient Overhead Cinema Spotlights */}
      <div className="absolute top-0 left-1/4 w-48 h-24 bg-cinema-gold/15 blur-3xl pointer-events-none"/>
      <div className="absolute top-0 right-1/4 w-48 h-24 bg-sky-500/15 blur-3xl pointer-events-none"/>

      {/* Screen Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-cinema-800">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-cinema-gold"/>
          <span className="font-semibold text-slate-300">
            {theatreName ? `${theatreName} — Interval Screening` : 'Auditorium Interval Screen'}
          </span>
        </div>
        {movieTitle && (<span className="text-amber-400 font-medium">During: {movieTitle}</span>)}
      </div>

      {/* Realistic Curved Silver Cinema Screen */}
      <div className="relative mx-auto rounded-2xl bg-gradient-to-b from-slate-900 via-black to-slate-950 border-4 border-slate-700/60 screen-glow overflow-hidden aspect-video flex items-center justify-center">
        {/* If Media is Uploaded */}
        {mediaPreviewUrl && mediaType === 'IMAGE' && (<img src={mediaPreviewUrl} alt="Screen Content Preview" className="absolute inset-0 w-full h-full object-cover opacity-85"/>)}

        {mediaPreviewUrl && mediaType === 'VIDEO' && (<video src={mediaPreviewUrl} controls className="absolute inset-0 w-full h-full object-contain bg-black"/>)}

        {/* Cinematic Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none"/>

        {/* Message Banner on Screen */}
        {(!mediaPreviewUrl || mediaType === 'IMAGE') && (<div className="relative z-10 text-center px-6 py-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase bg-cinema-gold/30 text-amber-300 border border-cinema-gold/40 shadow-lg backdrop-blur-md mb-3">
              <Sparkles className="w-3.5 h-3.5"/>
              {formatCategory(bookingType)}
            </div>

            <h2 className="font-cinema text-xl sm:text-3xl lg:text-4xl font-black tracking-wide text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] leading-snug">
              "{message || 'Your customized interval message will be projected here.'}"
            </h2>
          </div>)}
      </div>

      {/* Screen Base Arc / Projection beam */}
      <div className="w-3/4 h-2 mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent blur-[1px] rounded-full"/>

      {/* Cinema Theatre Audience Seating Silhouette */}
      <div className="mt-8 flex justify-center items-end gap-1.5 sm:gap-2.5 opacity-30 pointer-events-none">
        {[...Array(14)].map((_, i) => (<div key={i} className="w-5 sm:w-8 h-4 sm:h-6 rounded-t-lg bg-slate-700 border-t border-slate-600 shadow-inner"/>))}
      </div>
      <p className="text-center text-[11px] text-slate-500 mt-2">
        Auditorium Audience Viewpoint
      </p>
    </div>);
};
