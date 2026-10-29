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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-white border-2 border-[#CBC3E3] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#CBC3E3] pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] flex items-center justify-center text-[#9F2B68] shadow-sm">
                            <CreditCard className="w-5 h-5 text-[#9F2B68]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#301934] font-cinema">Add Escrow Funds</h3>
                            <p className="text-xs text-[#AA98A9] font-mono">Instant Cinema Escrow Credit</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl bg-[#F8F6FC] hover:bg-[#E6E6FA] text-[#483248] hover:text-[#301934] transition-all border border-[#CBC3E3] cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Current Balance */}
                <div className="p-4 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] flex items-center justify-between font-mono">
                    <span className="text-xs text-[#483248]">Current Balance:</span>
                    <span className="text-base font-extrabold text-[#9F2B68]">
                        ₹{Number(user?.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Preset Amount Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#301934]">Choose Recharge Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                        {presetAmounts.map((amt) => (
                            <button
                                key={amt}
                                type="button"
                                onClick={() => setAmount(amt)}
                                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    amount === amt
                                        ? 'bg-[#FFF0F7] text-[#9F2B68] border-2 border-[#9F2B68] shadow-sm'
                                        : 'bg-[#F8F6FC] text-[#483248] border-[#CBC3E3] hover:bg-white'
                                }`}
                            >
                                ₹{amt}
                            </button>
                        ))}
                    </div>
                    <div className="mt-2 relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#AA98A9] font-bold">₹</span>
                        <input
                            type="number"
                            min="100"
                            step="50"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-[#CBC3E3] text-sm font-semibold text-[#301934] focus:outline-none focus:border-[#9F2B68]"
                            placeholder="Custom amount"
                        />
                    </div>
                </div>

                {/* Payment Gateway Method */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#301934]">Select Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('UPI')}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                paymentMethod === 'UPI'
                                    ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#301934]'
                                    : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                            }`}
                        >
                            <QrCode className="w-5 h-5 text-[#9F2B68]" />
                            <div>
                                <span className="text-xs font-bold block text-[#301934]">Instant UPI</span>
                                <span className="text-[10px] text-[#AA98A9]">GPay, PhonePe, QR</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPaymentMethod('RAZORPAY')}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                paymentMethod === 'RAZORPAY'
                                    ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#301934]'
                                    : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white'
                            }`}
                        >
                            <CreditCard className="w-5 h-5 text-[#9F2B68]" />
                            <div>
                                <span className="text-xs font-bold block text-[#301934]">Card / NetBanking</span>
                                <span className="text-[10px] text-[#AA98A9]">Razorpay / Stripe</span>
                            </div>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 text-[#800020] text-xs font-medium">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="p-3 rounded-xl bg-[#F8F5FF] border border-[#5D3FD3]/30 text-[#5D3FD3] text-xs flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-[#5D3FD3]" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* Submit Action */}
                <button
                    type="button"
                    onClick={handleTopup}
                    disabled={loading || amount <= 0}
                    className="btn-cinema-shimmer w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:opacity-95 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{loading ? 'Processing Escrow Deposit...' : `Authorize & Deposit ₹${Number(amount || 0).toFixed(2)}`}</span>
                </button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#AA98A9]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5D3FD3]" />
                    <span>256-bit Encrypted Payment Gateway</span>
                </div>
            </div>
        </div>
    );
};
