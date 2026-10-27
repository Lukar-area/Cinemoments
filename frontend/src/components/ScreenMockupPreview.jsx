import React, { useState, useEffect } from 'react';
import { Sparkles, Film, Maximize2, Minimize2, Volume2, VolumeX, Eye, Sliders, Palette } from 'lucide-react';

export const ScreenMockupPreview = ({
    message,
    bookingType,
    mediaPreviewUrl,
    mediaType,
    movieTitle,
    theatreName,
}) => {
    const [curtainsOpen, setCurtainsOpen] = useState(true);
    const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' | '2.39:1' | '1.43:1'
    const [theme, setTheme] = useState('GOLD'); // 'GOLD' | 'ROSE' | 'CYAN' | 'VINTAGE'
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);

    // Play synthesized Cinema Chime using Web Audio API
    const playCinemaChime = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Cinema Arpeggio)
            notes.forEach((freq, index) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15);
                gain.gain.setValueAtTime(0.15, ctx.currentTime + index * 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.15 + 1.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + index * 0.15);
                osc.stop(ctx.currentTime + index * 0.15 + 1.3);
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

    // Theme style mapping
    const themeStyles = {
        GOLD: {
            badge: 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-amber-500/20',
            glow: 'drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]',
            text: 'text-amber-100',
            border: 'border-amber-500/40',
            beam: 'from-amber-400/20 to-transparent',
        },
        ROSE: {
            badge: 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-rose-500/20',
            glow: 'drop-shadow-[0_0_25px_rgba(244,63,94,0.7)]',
            text: 'text-rose-100',
            border: 'border-rose-500/40',
            beam: 'from-rose-400/20 to-transparent',
        },
        CYAN: {
            badge: 'bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-cyan-500/20',
            glow: 'drop-shadow-[0_0_25px_rgba(6,182,212,0.7)]',
            text: 'text-cyan-100',
            border: 'border-cyan-500/40',
            beam: 'from-cyan-400/20 to-transparent',
        },
        VINTAGE: {
            badge: 'bg-yellow-600/25 text-yellow-200 border-yellow-600/50 font-serif',
            glow: 'drop-shadow-[0_2px_10px_rgba(234,179,8,0.4)]',
            text: 'text-yellow-50 font-serif',
            border: 'border-yellow-700/60',
            beam: 'from-yellow-200/15 to-transparent',
        },
    };

    const currentTheme = themeStyles[theme] || themeStyles.GOLD;

    const aspectClasses = {
        '16:9': 'aspect-video',
        '2.39:1': 'aspect-[21/9]',
        '1.43:1': 'aspect-[4/3]',
    };

    const content = (
        <div className={`relative w-full rounded-3xl bg-gradient-to-b from-slate-950 via-zinc-950 to-black p-4 sm:p-7 border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${isFullscreen ? 'max-w-6xl mx-auto' : 'max-w-4xl mx-auto'}`}>
            {/* Overhead Projector Light Beam */}
            <div
                className={`absolute -top-12 left-1/2 -translate-x-1/2 w-4/5 h-48 bg-gradient-to-b ${currentTheme.beam} blur-3xl pointer-events-none opacity-70 transition-all duration-500`}
            />

            {/* Screen Header Controls & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span className="font-semibold text-slate-200">
                        {theatreName ? `${theatreName} — Interval Screening` : 'Auditorium Interval Screen'}
                    </span>
                    {movieTitle && (
                        <span className="hidden sm:inline text-amber-400 font-medium">
                            • Showing: {movieTitle}
                        </span>
                    )}
                </div>

                {/* Interactive Cinema Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Curtains Toggle */}
                    <button
                        type="button"
                        onClick={() => setCurtainsOpen(!curtainsOpen)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1 ${
                            curtainsOpen
                                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                : 'bg-red-950/80 text-red-200 border-red-800/80'
                        }`}
                        title="Toggle Velvet Curtains"
                    >
                        <Eye className="w-3 h-3" />
                        <span>{curtainsOpen ? 'Open Curtains' : 'Curtains Closed'}</span>
                    </button>

                    {/* Audio Chime Button */}
                    <button
                        type="button"
                        onClick={handleToggleAudio}
                        className={`p-1.5 rounded-lg border transition-all ${
                            soundEnabled
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                        }`}
                        title="Cinema Chime Audio"
                    >
                        {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </button>

                    {/* Aspect Ratio Switcher */}
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-slate-900 text-slate-300 border border-slate-700 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400"
                        title="Screen Aspect Ratio"
                    >
                        <option value="16:9">Widescreen 16:9</option>
                        <option value="2.39:1">CinemaScope 2.39:1</option>
                        <option value="1.43:1">IMAX 1.43:1</option>
                    </select>

                    {/* Theme Switcher */}
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="bg-slate-900 text-slate-300 border border-slate-700 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400"
                        title="Screen Color Theme"
                    >
                        <option value="GOLD">Gold Royale</option>
                        <option value="ROSE">Neon Romance</option>
                        <option value="CYAN">Cyber Cyan</option>
                        <option value="VINTAGE">Vintage Hollywood</option>
                    </select>

                    {/* Fullscreen Mode Button */}
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Auditorium Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Realistic Cinema Stage & Screen Container */}
            <div className="relative mx-auto rounded-2xl bg-gradient-to-b from-black via-slate-950 to-black border-4 border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center transition-all duration-300">
                {/* Curved Screen Aspect Wrapper */}
                <div className={`relative w-full ${aspectClasses[aspectRatio]} flex items-center justify-center overflow-hidden`}>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

                    {/* Interval Message Card projected on screen */}
                    {(!mediaPreviewUrl || mediaType === 'IMAGE') && (
                        <div className="relative z-10 text-center px-6 py-6 max-w-2xl mx-auto">
                            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase border backdrop-blur-md mb-4 shadow-lg transition-all ${currentTheme.badge}`}>
                                <Sparkles className="w-3.5 h-3.5" />
                                {formatCategory(bookingType)}
                            </div>

                            <h2 className={`text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-wide text-white leading-snug drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] transition-all ${currentTheme.glow} ${currentTheme.text}`}>
                                "{message || 'Your customized interval message will be projected here.'}"
                            </h2>

                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-300 opacity-90">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span>Interval Spotlight • Auditorium Big Screen</span>
                            </div>
                        </div>
                    )}

                    {/* Red Velvet Cinema Curtains Overlay */}
                    <div
                        className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-r-2 border-amber-500/40 shadow-2xl transition-transform duration-700 ease-in-out z-20 flex flex-col justify-between p-4 ${
                            curtainsOpen ? '-translate-x-full' : 'translate-x-0'
                        }`}
                        style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, rgba(120,0,0,0.4) 0px, rgba(50,0,0,0.7) 12px, rgba(120,0,0,0.4) 24px)',
                        }}
                    >
                        <div className="h-4 bg-amber-400/20 rounded-full blur-xs" />
                        <div className="text-right text-[10px] uppercase tracking-widest text-amber-300/80 font-bold pr-2">
                            Curtain Left
                        </div>
                    </div>

                    <div
                        className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-950 via-red-900 to-red-950 border-l-2 border-amber-500/40 shadow-2xl transition-transform duration-700 ease-in-out z-20 flex flex-col justify-between p-4 ${
                            curtainsOpen ? 'translate-x-full' : 'translate-x-0'
                        }`}
                        style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, rgba(120,0,0,0.4) 0px, rgba(50,0,0,0.7) 12px, rgba(120,0,0,0.4) 24px)',
                        }}
                    >
                        <div className="h-4 bg-amber-400/20 rounded-full blur-xs" />
                        <div className="text-left text-[10px] uppercase tracking-widest text-amber-300/80 font-bold pl-2">
                            Curtain Right
                        </div>
                    </div>
                </div>
            </div>

            {/* Realistic Screen Base Reflection Beam */}
            <div className={`w-3/4 h-2 mx-auto mt-2 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent blur-[2px] rounded-full`} />

            {/* Cinema Theatre Audience Seating Silhouettes */}
            <div className="mt-8 flex justify-center items-end gap-1.5 sm:gap-2.5 opacity-35 pointer-events-none">
                {[...Array(14)].map((_, i) => (
                    <div
                        key={i}
                        className="w-5 sm:w-8 h-4 sm:h-6 rounded-t-lg bg-slate-700 border-t border-slate-600 shadow-inner"
                    />
                ))}
            </div>
            <p className="text-center text-[11px] text-slate-500 mt-2">
                Auditorium Audience Viewpoint • Cinema Pro Projection
            </p>
        </div>
    );

    // If Fullscreen Modal is active
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
                <div className="w-full max-w-5xl">
                    <div className="flex justify-between items-center mb-4 text-slate-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                                Fullscreen Cinema Auditorium Preview Mode
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(false)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-all"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                            <span>Exit Fullscreen (Esc)</span>
                        </button>
                    </div>
                    {content}
                </div>
            </div>
        );
    }

    return content;
};
