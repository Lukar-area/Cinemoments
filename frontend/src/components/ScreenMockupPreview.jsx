import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Film,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Palette,
  Play,
  RotateCcw,
} from 'lucide-react';

export const ScreenMockupPreview = ({
  message,
  bookingType,
  mediaPreviewUrl,
  mediaType,
  movieTitle,
  theatreName,
}) => {
  const [curtainsOpen, setCurtainsOpen] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('2.39:1'); // '16:9' | '2.39:1' | '1.43:1'
  const [theme, setTheme] = useState('AMARANTH'); // 'AMARANTH' | 'BURGUNDY' | 'IRIS' | 'ORCHID'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [countdown, setCountdown] = useState(null); // null or 3,2,1

  // Play synthesized Cinema Chime using Web Audio API
  const playCinemaChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A Major 9th Cinema Fanfare
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.14);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + index * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.14 + 1.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.14);
        osc.stop(ctx.currentTime + index * 0.14 + 1.7);
      });
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  };

  const handleToggleAudio = () => {
    if (!soundEnabled) {
      playCinemaChime();
    }
    setSoundEnabled(!soundEnabled);
  };

  const startCountdown = () => {
    playCinemaChime();
    setCurtainsOpen(false);
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCurtainsOpen(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Close on Escape in fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const formatCategory = (type) => {
    if (!type) return 'Interval Celebration';
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Theme style mapping with Amaranth, Burgundy, Iris, and Orchid
  const themeStyles = {
    AMARANTH: {
      badge: 'bg-[#9F2B68] text-white border-white/50 shadow-md',
      glow: 'drop-shadow-[0_0_25px_rgba(159,43,104,0.8)]',
      text: 'text-[#FFFFFF]',
      border: 'border-[#9F2B68]',
      beam: 'from-[#9F2B68]/30 via-[#BF40BF]/15 to-transparent',
      screenAmbient: 'shadow-[0_0_80px_rgba(159,43,104,0.3)]',
    },
    BURGUNDY: {
      badge: 'bg-[#800020] text-white border-white/50 shadow-md',
      glow: 'drop-shadow-[0_0_30px_rgba(128,0,32,0.85)]',
      text: 'text-[#E6E6FA] font-serif',
      border: 'border-[#800020]',
      beam: 'from-[#800020]/30 via-[#770737]/15 to-transparent',
      screenAmbient: 'shadow-[0_0_80px_rgba(128,0,32,0.3)]',
    },
    IRIS: {
      badge: 'bg-[#5D3FD3] text-white border-white/50 shadow-md',
      glow: 'drop-shadow-[0_0_30px_rgba(93,63,211,0.85)]',
      text: 'text-white',
      border: 'border-[#5D3FD3]',
      beam: 'from-[#5D3FD3]/30 via-[#CF9FFF]/15 to-transparent',
      screenAmbient: 'shadow-[0_0_80px_rgba(93,63,211,0.3)]',
    },
    ORCHID: {
      badge: 'bg-[#DA70D6] text-[#301934] border-white/50 font-serif shadow-md font-bold',
      glow: 'drop-shadow-[0_2px_15px_rgba(218,112,214,0.8)]',
      text: 'text-white font-serif',
      border: 'border-[#DA70D6]',
      beam: 'from-[#DA70D6]/30 via-[#E0B0FF]/15 to-transparent',
      screenAmbient: 'shadow-[0_0_80px_rgba(218,112,214,0.3)]',
    },
  };

  const currentTheme = themeStyles[theme] || themeStyles.AMARANTH;

  const aspectClasses = {
    '16:9': 'aspect-video',
    '2.39:1': 'aspect-[21/9]',
    '1.43:1': 'aspect-[4/3]',
  };

  const content = (
    <div
      className={`relative w-full rounded-3xl bg-white p-4 sm:p-7 border-2 border-[#CBC3E3] shadow-xl overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'max-w-6xl mx-auto' : 'max-w-4xl mx-auto'
      }`}
    >
      {/* Overhead Volumetric Projector Light Beam */}
      <div
        className={`absolute -top-12 left-1/2 -translate-x-1/2 w-4/5 h-48 bg-gradient-to-b ${currentTheme.beam} blur-3xl pointer-events-none opacity-80 transition-all duration-500`}
      />

      {/* Screen Header Controls & Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#5E435E] mb-4 pb-3 border-b border-[#E6E6FA]">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#9F2B68] animate-pulse" />
          <span className="font-mono font-bold text-[#301934] uppercase tracking-wider text-[11px]">
            {theatreName ? `${theatreName} — Interval Playout` : 'Auditorium Interval Simulator'}
          </span>
          {movieTitle && (
            <span className="hidden sm:inline text-[#9F2B68] font-mono text-[11px] font-bold">
              • Feature: {movieTitle}
            </span>
          )}
        </div>

        {/* Interactive Cinema Console Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cinema Countdown Trigger */}
          <button
            type="button"
            onClick={startCountdown}
            className="px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold bg-[#E6E6FA] text-[#9F2B68] border border-[#CBC3E3] hover:bg-[#9F2B68] hover:text-white transition-all flex items-center gap-1 uppercase tracking-wider shadow-sm"
            title="Start Cinematic Curtain Reveal"
          >
            <Play className="w-3 h-3" />
            <span>Curtain Call</span>
          </button>

          {/* Curtains Toggle */}
          <button
            type="button"
            onClick={() => setCurtainsOpen(!curtainsOpen)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-all flex items-center gap-1 uppercase tracking-wider ${
              curtainsOpen
                ? 'bg-white text-[#483248] border-[#CBC3E3] hover:bg-[#F3F3FD]'
                : 'bg-[#800020] text-white border-[#5E0017]'
            }`}
            title="Toggle Velvet Curtains"
          >
            <Eye className="w-3 h-3" />
            <span>{curtainsOpen ? 'Curtains Open' : 'Closed'}</span>
          </button>

          {/* Audio Chime Button */}
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`p-1.5 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-[#E6E6FA] text-[#9F2B68] border-[#9F2B68]/50 shadow-sm'
                : 'bg-white text-[#5E435E] border-[#CBC3E3] hover:text-[#9F2B68]'
            }`}
            title="Cinema Chime Audio"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#9F2B68]" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Aspect Ratio Switcher */}
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="bg-[#F8F6FC] text-[#301934] border border-[#CBC3E3] text-[10px] font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#9F2B68]"
            title="Screen Aspect Ratio"
          >
            <option value="2.39:1">2.39:1 Cinemascope</option>
            <option value="16:9">16:9 Widescreen</option>
            <option value="1.43:1">1.43:1 IMAX</option>
          </select>

          {/* Theme Switcher */}
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-[#F8F6FC] text-[#301934] border border-[#CBC3E3] text-[10px] font-mono font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#9F2B68]"
            title="Screen Color Theme"
          >
            <option value="AMARANTH">Amaranth Royale</option>
            <option value="BURGUNDY">Burgundy Velvet</option>
            <option value="IRIS">Iris Cyber 4K</option>
            <option value="ORCHID">Orchid Romance</option>
          </select>

          {/* Fullscreen Mode Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-xl bg-white hover:bg-[#F3F3FD] text-[#5E435E] border border-[#CBC3E3] transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Auditorium Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Realistic Cinema Stage & Curved Screen Container */}
      <div
        className={`relative mx-auto rounded-3xl bg-[#301934] border-4 border-[#201023] overflow-hidden flex items-center justify-center transition-all duration-300 ${currentTheme.screenAmbient}`}
      >
        {/* Curved Screen Aspect Wrapper */}
        <div
          className={`relative w-full ${aspectClasses[aspectRatio]} flex items-center justify-center overflow-hidden`}
        >
          {/* Uploaded Media Background */}
          {mediaPreviewUrl && mediaType === 'IMAGE' && (
            <img
              src={mediaPreviewUrl}
              alt="Screen Content Preview"
              className="absolute inset-0 w-full h-full object-cover opacity-85 transition-opacity"
            />
          )}

          {mediaPreviewUrl && mediaType === 'VIDEO' && (
            <video
              src={mediaPreviewUrl}
              controls
              className="absolute inset-0 w-full h-full object-contain bg-black"
            />
          )}

          {/* Cinematic Vignette & Ambient Light Gradient */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black/85 pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          {/* Interval Message Card projected on screen */}
          {(!mediaPreviewUrl || mediaType === 'IMAGE') && (
            <div className="relative z-10 text-center px-6 py-6 max-w-2xl mx-auto">
              <div
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase border backdrop-blur-md mb-4 shadow-lg transition-all ${currentTheme.badge}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {formatCategory(bookingType)}
              </div>

              <h2
                className={`font-cinema text-xl sm:text-3xl lg:text-4xl font-black tracking-wide text-white leading-snug drop-shadow-[0_4px_20px_rgba(0,0,0,1)] transition-all ${currentTheme.glow} ${currentTheme.text}`}
              >
                "{message || 'Your customized interval moment will illuminate this silver screen.'}"
              </h2>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/90 font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-[#DA70D6] animate-ping" />
                <span>Intermission Spotlight • 4K Laser Projection</span>
              </div>
            </div>
          )}

          {/* Film Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 bg-[#301934]/95 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-4 border-[#9F2B68] flex items-center justify-center relative animate-pulse shadow-glow-amaranth">
                <span className="font-marquee text-6xl font-bold text-white">
                  {countdown}
                </span>
              </div>
              <span className="mt-4 font-mono text-xs tracking-widest uppercase text-[#CBC3E3]">
                AUDITORIUM OVERTURE
              </span>
            </div>
          )}

          {/* Red Velvet Cinema Curtains in Burgundy & Mulberry */}
          <div
            className={`absolute inset-y-0 left-0 w-1/2 velvet-curtain border-r-2 border-[#9F2B68] shadow-2xl transition-transform duration-700 ease-in-out z-20 flex flex-col justify-between p-4 ${
              curtainsOpen ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="h-4 bg-white/20 rounded-full blur-xs" />
            <div className="text-right text-[10px] font-mono uppercase tracking-widest text-[#E6E6FA] font-bold pr-2">
              CURTAIN LEFT
            </div>
          </div>

          <div
            className={`absolute inset-y-0 right-0 w-1/2 velvet-curtain border-l-2 border-[#9F2B68] shadow-2xl transition-transform duration-700 ease-in-out z-20 flex flex-col justify-between p-4 ${
              curtainsOpen ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className="h-4 bg-white/20 rounded-full blur-xs" />
            <div className="text-left text-[10px] font-mono uppercase tracking-widest text-[#E6E6FA] font-bold pl-2">
              CURTAIN RIGHT
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Screen Base Reflection Beam */}
      <div className="w-3/4 h-2 mx-auto mt-2 bg-gradient-to-r from-transparent via-[#9F2B68]/30 to-transparent blur-[2px] rounded-full" />

      {/* Cinema Theatre Audience Seating Silhouettes */}
      <div className="mt-8 flex justify-center items-end gap-1.5 sm:gap-3 opacity-80 pointer-events-none select-none">
        {[...Array(14)].map((_, i) => (
          <div
            key={i}
            className="w-5 sm:w-8 h-4 sm:h-6 rounded-t-lg bg-gradient-to-t from-[#301934] via-[#483248] to-[#702963] border-t border-[#AA98A9]/50 shadow-md relative"
          >
            <div className="w-full h-0.5 bg-[#9F2B68]/40 rounded-t-sm" />
          </div>
        ))}
      </div>
      <p className="text-center text-[10px] font-mono tracking-widest uppercase text-[#5E435E] mt-2 font-bold">
        Auditorium Audience Perspective • 4K Laser Projection Playout
      </p>
    </div>
  );

  // If Fullscreen Modal is active
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#301934]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-5xl">
          <div className="flex justify-between items-center mb-4 text-[#E6E6FA]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DA70D6] animate-ping" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Auditorium Fullscreen Projection View
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#301934] text-xs font-mono uppercase tracking-wider border border-[#CBC3E3] font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit (Esc)</span>
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
