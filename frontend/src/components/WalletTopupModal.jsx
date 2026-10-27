import React, { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { X, CreditCard, QrCode, CheckCircle2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const WalletTopupModal = ({ isOpen, onClose }) => {
    const { user, refreshUser } = useAuth();
    const [amount, setAmount] = useState(1000);
    const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'RAZORPAY' | 'CARD'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    if (!isOpen) return null;

    const presetAmounts = [500, 1000, 2000, 5000];

    const handleTopup = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMsg(null);

            const res = await api.payments.topupWallet({
                amount: Number(amount),
                paymentMethod,
                paymentId: `pay_top_${Date.now()}`,
            });

            await refreshUser?.();
            setSuccessMsg(`Successfully credited ₹${Number(amount).toFixed(2)} to your wallet!`);
            setTimeout(() => {
                onClose();
                setSuccessMsg(null);
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to complete wallet recharge.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Add Funds to Wallet</h3>
                            <p className="text-xs text-slate-400">Instant Escrow Wallet Recharge</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Current Balance */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Current Wallet Balance:</span>
                    <span className="text-base font-extrabold text-amber-300">
                        ₹{Number(user?.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Preset Amount Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Choose Recharge Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                        {presetAmounts.map((amt) => (
                            <button
                                key={amt}
                                type="button"
                                onClick={() => setAmount(amt)}
                                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                    amount === amt
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                                }`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">₹</span>
                        <input
                            type="number"
                            min="100"
                            step="50"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
                            placeholder="Custom amount"
                        />
                    </div>
                </div>

                {/* Payment Gateway Method */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('UPI')}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                paymentMethod === 'UPI'
                                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <QrCode className="w-5 h-5 text-amber-400" />
                            <div>
                                <span className="text-xs font-bold block text-white">Instant UPI</span>
                                <span className="text-[10px] text-slate-400">GPay, PhonePe, QR</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('RAZORPAY')}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                                paymentMethod === 'RAZORPAY'
                                    ? 'bg-amber-500/15 border-amber-500/50 text-white'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <CreditCard className="w-5 h-5 text-amber-400" />
                            <div>
                                <span className="text-xs font-bold block text-white">Card / NetBanking</span>
                                <span className="text-[10px] text-slate-400">Razorpay / Stripe</span>
                            </div>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Submit Action */}
                <button
                    type="button"
                    onClick={handleTopup}
                    disabled={loading || amount <= 0}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{loading ? 'Processing Payment...' : `Authorize & Top Up ₹${Number(amount || 0).toFixed(2)}`}</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>256-bit Encrypted Payment Gateway</span>
                </div>
            </div>
        </div>
    );
};
