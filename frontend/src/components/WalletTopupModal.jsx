import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.js';
import { X, CreditCard, QrCode, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

export const WalletTopupModal = ({ isOpen, onClose }) => {
    const { user, refreshUser } = useAuth();
    const [amount, setAmount] = useState(1000);
    const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'RAZORPAY' | 'CARD'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Close on Escape key and prevent background scroll while open
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const presetAmounts = [500, 1000, 2000, 5000];

    const handleTopup = async () => {
        try {
            setLoading(true);
            setError(null);
            setSuccessMsg(null);

            const numAmount = Number(amount);
            if (!numAmount || numAmount < 100) {
                setError('Please enter a minimum recharge amount of ₹100.');
                return;
            }

            await api.payments.topupWallet({
                amount: numAmount,
                paymentMethod,
                paymentId: `pay_top_${Date.now()}`,
            });

            await refreshUser?.();
            setSuccessMsg(`Successfully credited ₹${numAmount.toFixed(2)} to your wallet!`);
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
        <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-topup-title"
        >
            {/* Centering wrapper that allows seamless top-to-bottom scroll when content exceeds viewport */}
            <div className="min-h-full flex flex-col justify-center items-center py-2 sm:py-6">
                <div 
                    className="relative w-full max-w-md bg-white border-2 border-[#CBC3E3] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[min(90vh,680px)] my-auto animate-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Fixed Pinned Header - Never cropped or pushed off screen */}
                    <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-4.5 border-b border-[#CBC3E3] bg-[#FAFAFE]/90 backdrop-blur-xs shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] flex items-center justify-center text-[#9F2B68] shadow-sm shrink-0">
                                <CreditCard className="w-5 h-5 text-[#9F2B68]" />
                            </div>
                            <div>
                                <h3 id="wallet-topup-title" className="text-base sm:text-lg font-bold text-[#301934] font-cinema leading-tight">
                                    Add Escrow Funds
                                </h3>
                                <p className="text-[11px] sm:text-xs text-[#AA98A9] font-mono">
                                    Instant Cinema Escrow Credit
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close modal"
                            className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-[#E6E6FA] text-[#483248] hover:text-[#9F2B68] transition-all border border-[#CBC3E3] cursor-pointer shadow-xs active:scale-95"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrollable Content Body */}
                    <div className="px-5 py-4 sm:px-6 sm:py-4.5 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain">
                        {/* Current Balance */}
                        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] flex items-center justify-between font-mono shadow-inner">
                            <span className="text-xs text-[#483248] font-medium">Current Balance:</span>
                            <span className="text-base font-extrabold text-[#9F2B68]">
                                ₹{Number(user?.wallet_balance ?? 2000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Preset Amount Selector */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-[#301934]">Choose Recharge Amount</label>
                                <span className="text-[10px] text-[#AA98A9] font-mono">Min ₹100</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {presetAmounts.map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => setAmount(amt)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                            Number(amount) === amt
                                                ? 'bg-[#FFF0F7] text-[#9F2B68] border-2 border-[#9F2B68] shadow-sm font-black scale-[1.02]'
                                                : 'bg-[#F8F6FC] text-[#483248] border-[#CBC3E3] hover:bg-white hover:border-[#9F2B68]/40'
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
                                    onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                                    className="w-full pl-8 pr-4 py-2 sm:py-2.5 rounded-xl bg-white border border-[#CBC3E3] text-sm font-semibold text-[#301934] focus:outline-none focus:border-[#9F2B68] transition-colors"
                                    placeholder="Enter custom amount"
                                />
                            </div>
                        </div>

                        {/* Payment Gateway Method */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#301934]">Select Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('UPI')}
                                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer ${
                                        paymentMethod === 'UPI'
                                            ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#301934] shadow-xs'
                                            : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white hover:border-[#9F2B68]/40'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${paymentMethod === 'UPI' ? 'bg-[#9F2B68] text-white' : 'bg-[#E6E6FA] text-[#9F2B68]'}`}>
                                        <QrCode className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold block text-[#301934] truncate">Instant UPI</span>
                                        <span className="text-[10px] text-[#AA98A9] block truncate">GPay, PhonePe, QR</span>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('RAZORPAY')}
                                    className={`p-2.5 sm:p-3 rounded-2xl border text-left flex items-center gap-2.5 sm:gap-3 transition-all cursor-pointer ${
                                        paymentMethod === 'RAZORPAY'
                                            ? 'bg-[#FFF0F7] border-2 border-[#9F2B68] text-[#301934] shadow-xs'
                                            : 'bg-[#F8F6FC] border-[#CBC3E3] text-[#483248] hover:bg-white hover:border-[#9F2B68]/40'
                                    }`}
                                >
                                    <div className={`p-2 rounded-xl shrink-0 transition-colors ${paymentMethod === 'RAZORPAY' ? 'bg-[#9F2B68] text-white' : 'bg-[#E6E6FA] text-[#9F2B68]'}`}>
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold block text-[#301934] truncate">Card / NetBanking</span>
                                        <span className="text-[10px] text-[#AA98A9] block truncate">Razorpay / Stripe</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-xl bg-[#FFF0F4] border border-[#800020]/30 text-[#800020] text-xs font-medium leading-relaxed break-words animate-in fade-in duration-150">
                                {error}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-3 rounded-xl bg-[#F8F5FF] border border-[#5D3FD3]/30 text-[#5D3FD3] text-xs flex items-center gap-2 font-medium animate-in fade-in duration-150">
                                <CheckCircle2 className="w-4 h-4 text-[#5D3FD3] shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}
                    </div>

                    {/* Fixed Pinned Footer - Action buttons always reachable */}
                    <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-[#CBC3E3]/60 bg-[#FAFAFE] shrink-0 space-y-2">
                        <button
                            type="button"
                            onClick={handleTopup}
                            disabled={loading || !amount || Number(amount) <= 0}
                            className="btn-cinema-shimmer w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] hover:opacity-95 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
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
            </div>
        </div>
    );
};
