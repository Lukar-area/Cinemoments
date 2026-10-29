import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
export const ConfirmationModal = ({ isOpen, title, description, confirmLabel = 'Confirm', confirmVariant = 'danger', showReasonInput = false, reasonValue = '', onReasonChange, onConfirm, onClose, loading = false, }) => {
    if (!isOpen)
        return null;
    const btnClasses = {
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30',
        success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30',
        warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30',
    }[confirmVariant];
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-3xl bg-white border-2 border-[#CBC3E3] shadow-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${confirmVariant === 'success'
            ? 'bg-emerald-500/10 text-emerald-600'
            : confirmVariant === 'danger'
                ? 'bg-[#FFF0F4] text-[#800020]'
                : 'bg-[#FFF0F7] text-[#9F2B68]'}`}>
              <AlertTriangle className="w-5 h-5"/>
            </div>
            <h3 className="text-base font-bold text-[#301934] font-cinema">{title}</h3>
          </div>
          <button onClick={onClose} className="text-[#AA98A9] hover:text-[#9F2B68] p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <p className="mt-3 text-sm text-[#483248] leading-relaxed font-medium">{description}</p>

        {showReasonInput && (<div className="mt-4">
            <label className="block text-xs font-semibold text-[#301934] mb-1">
              Reason / Remarks for Customer:
            </label>
            <textarea rows={3} value={reasonValue} onChange={(e) => onReasonChange && onReasonChange(e.target.value)} placeholder="e.g. Interval slot already fully reserved for emergency maintenance..." className="w-full px-3 py-2 text-sm rounded-xl bg-[#F8F6FC] border border-[#CBC3E3] text-[#301934] placeholder-[#AA98A9] focus:outline-none focus:border-[#9F2B68]"/>
          </div>)}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-[#483248] hover:text-[#301934] bg-[#F8F6FC] hover:bg-[#E6E6FA] border border-[#CBC3E3] rounded-xl transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer ${btnClasses} disabled:opacity-50`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>);
};
