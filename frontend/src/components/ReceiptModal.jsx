import React from 'react';
import { CheckCircle2, Printer, X, Film, ShieldCheck, Download, Sparkles } from 'lucide-react';

export const ReceiptModal = ({ receipt, onClose }) => {
    if (!receipt) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8">
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-zinc-900 to-slate-950 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                            Digital Receipt & Tax Invoice
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Printable Invoice Container */}
                <div className="p-6 sm:p-8 space-y-6 print:p-0 print:text-black" id="printable-receipt">
                    {/* Header Banner */}
                    <div className="text-center space-y-1 pb-4 border-b border-slate-800">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
                            <Film className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-white">
                            CINEMOMENTS
                        </h2>
                        <p className="text-xs text-slate-400">
                            Cinema Big-Screen Interval Booking Platform
                        </p>
                        <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Payment Completed & Slot Reserved</span>
                        </div>
                    </div>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                        <div>
                            <span className="text-slate-500 block uppercase font-bold text-[10px]">Receipt Number</span>
                            <span className="text-amber-300 font-mono font-bold text-sm">
                                {receipt.receiptNumber || 'REC-2026-CONFIRMED'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block uppercase font-bold text-[10px]">Date & Time</span>
                            <span className="text-slate-200 font-medium">
                                {new Date(receipt.date || Date.now()).toLocaleString('en-IN', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                })}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-500 block uppercase font-bold text-[10px]">Customer</span>
                            <span className="text-slate-200 font-medium">{receipt.customer?.name || 'Customer'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500 block uppercase font-bold text-[10px]">Payment Method</span>
                            <span className="text-emerald-400 font-bold uppercase">
                                {receipt.payment?.paymentMethod || 'WALLET / UPI'}
                            </span>
                        </div>
                    </div>

                    {/* Booking Screening Details */}
                    {receipt.booking && (
                        <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 text-xs">
                            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Interval Screening Details
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Movie Title:</span>
                                    <span className="font-bold text-white">{receipt.booking.movieTitle}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Theatre:</span>
                                    <span className="font-semibold text-slate-200">{receipt.theatre?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Show Date:</span>
                                    <span className="font-semibold text-slate-200">{receipt.booking.showDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Interval Window:</span>
                                    <span className="font-bold text-amber-400">{receipt.booking.intervalSlot}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Booking Category:</span>
                                    <span className="font-semibold text-slate-200 capitalize">
                                        {receipt.booking.type?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Summary */}
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-300">
                            <span>Interval Slot Fee:</span>
                            <span className="font-bold text-white">
                                ₹{Number(receipt.payment?.totalAmount || 500).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>Platform Convenience Fee:</span>
                            <span className="text-emerald-400 font-bold">₹0.00 (Waived)</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                            <span>GST / Entertainment Tax:</span>
                            <span className="text-slate-300">Included</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-amber-500/20 text-sm font-black text-amber-300">
                            <span>Total Amount Paid:</span>
                            <span>₹{Number(receipt.payment?.totalAmount || 500).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Escrow Guarantee Notice */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>
                            Protected by CineMoments Escrow: If the theatre rejects your screening or showtime expires, your payment is 100% refunded instantly.
                        </span>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                    >
                        <Printer className="w-4 h-4" />
                        <span>Print / Save PDF</span>
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all"
                    >
                        Done & Close
                    </button>
                </div>
            </div>
        </div>
    );
};
