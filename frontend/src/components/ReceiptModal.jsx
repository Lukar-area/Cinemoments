import React from 'react';
import { CheckCircle2, Printer, X, Film, ShieldCheck, Download, Sparkles, QrCode } from 'lucide-react';

export const ReceiptModal = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#301934]/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white border-2 border-[#CBC3E3] rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F8F6FC] border-b border-[#E6E6FA]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9F2B68] animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#9F2B68]">
              AUDITORIUM ADMISSION & TAX INVOICE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-[#F3F3FD] text-[#5E435E] hover:text-[#9F2B68] transition-all border border-[#CBC3E3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Ticket Stub Container */}
        <div className="p-6 sm:p-8 space-y-6 print:p-0 print:text-black bg-white" id="printable-receipt">
          {/* Header Theatrical Banner */}
          <div className="text-center space-y-1 pb-4 border-b border-[#E6E6FA] relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] text-[#9F2B68] mb-2 shadow-sm">
              <Film className="w-6 h-6" />
            </div>
            <h2 className="font-cinema text-2xl font-black tracking-wider amaranth-metallic-text">
              CINEMOMENTS
            </h2>
            <p className="text-xs text-[#5E435E] font-mono uppercase tracking-widest font-semibold">
              OFFICIAL CINEMA INTERVAL PASS & RECEIPT
            </p>
            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-[#9F2B68] font-mono font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>PAYMENT SECURED • EXCLUSIVE INTERVAL RESERVED</span>
            </div>
          </div>

          {/* Ticket Body with Notches */}
          <div className="relative p-5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] space-y-4 font-mono text-xs shadow-inner">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#AA98A9] block uppercase font-bold text-[10px]">
                  Pass / Receipt #
                </span>
                <span className="text-[#9F2B68] font-bold text-sm">
                  {receipt.receiptNumber || 'REC-2026-CONFIRMED'}
                </span>
              </div>
              <div>
                <span className="text-[#AA98A9] block uppercase font-bold text-[10px]">
                  Playout Date & Time
                </span>
                <span className="text-[#301934] font-semibold">
                  {new Date(receipt.date || Date.now()).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <div>
                <span className="text-[#AA98A9] block uppercase font-bold text-[10px]">
                  Director / Customer
                </span>
                <span className="text-[#301934] font-semibold truncate block">
                  {receipt.customer?.name || 'Customer'}
                </span>
              </div>
              <div>
                <span className="text-[#AA98A9] block uppercase font-bold text-[10px]">
                  Method
                </span>
                <span className="text-[#5D3FD3] font-bold uppercase">
                  {receipt.payment?.paymentMethod || 'WALLET / ESCROW'}
                </span>
              </div>
            </div>

            {/* Perforated ticket tear line */}
            <div className="relative my-3">
              <div className="ticket-perforation-line h-0.5 w-full opacity-60" />
            </div>

            {/* Screening Details */}
            {receipt.booking && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between">
                  <span className="text-[#5E435E] uppercase text-[11px] font-bold">Feature:</span>
                  <span className="font-bold text-[#301934] text-right font-cinema">{receipt.booking.movieTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E435E] uppercase text-[11px] font-bold">Cinema:</span>
                  <span className="font-semibold text-[#9F2B68] text-right">{receipt.theatre?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E435E] uppercase text-[11px] font-bold">Interval Slot:</span>
                  <span className="font-bold text-[#301934] text-right">{receipt.booking.intervalSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5E435E] uppercase text-[11px] font-bold">Category:</span>
                  <span className="font-semibold text-[#301934] capitalize text-right">
                    {receipt.booking.type?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            )}

            {/* Simulated Barcode */}
            <div className="pt-3 flex flex-col items-center justify-center border-t border-[#CBC3E3]">
              <div className="flex items-center gap-1 h-8 opacity-80">
                {[4, 2, 6, 2, 8, 4, 2, 4, 8, 2, 6, 4, 2, 8, 4, 2, 6, 4, 8, 2, 4, 6].map((w, i) => (
                  <div key={i} className="h-full bg-[#301934]" style={{ width: `${w}px` }} />
                ))}
              </div>
              <span className="text-[9px] text-[#AA98A9] tracking-widest mt-1 font-bold">
                CINEMOMENTS-DCI-VERIFIED-PLAYOUT
              </span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 rounded-2xl bg-[#E6E6FA] border border-[#CBC3E3] space-y-2 text-xs font-mono">
            <div className="flex justify-between text-[#301934]">
              <span>Interval Slot Fee:</span>
              <span className="font-bold text-[#301934]">
                ₹{Number(receipt.payment?.totalAmount || 500).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[#5E435E]">
              <span>Auditorium Mastering Fee:</span>
              <span className="text-[#5D3FD3] font-bold">₹0.00 (Complimentary)</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#CBC3E3] text-sm font-black text-[#9F2B68]">
              <span>Total Amount Paid:</span>
              <span>₹{Number(receipt.payment?.totalAmount || 500).toFixed(2)}</span>
            </div>
          </div>

          {/* Escrow Guarantee Notice */}
          <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#F8F6FC] border border-[#CBC3E3] text-[11px] text-[#5E435E] font-medium">
            <ShieldCheck className="w-5 h-5 text-[#9F2B68] shrink-0" />
            <span>
              100% Escrow Protection: In case the cinema rejects your content or the showtime cancels, your payment is automatically refunded back to your wallet.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-6 bg-[#F8F6FC] border-t border-[#E6E6FA] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-[#F3F3FD] text-[#301934] text-xs font-mono font-bold uppercase tracking-wider transition-all border border-[#CBC3E3] shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#9F2B68]" />
            <span>Print Pass / PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-cinema-shimmer px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#9F2B68] via-[#BF40BF] to-[#5D3FD3] text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-[#9F2B68]/20 transition-all"
          >
            Curtain Close
          </button>
        </div>
      </div>
    </div>
  );
};
