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
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-cinema-850 border border-cinema-700 shadow-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${confirmVariant === 'success'
            ? 'bg-emerald-500/10 text-emerald-400'
            : confirmVariant === 'danger'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-amber-500/10 text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5"/>
            </div>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5"/>
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-300 leading-relaxed">{description}</p>

        {showReasonInput && (<div className="mt-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason / Remarks for Customer:
            </label>
            <textarea rows={3} value={reasonValue} onChange={(e) => onReasonChange && onReasonChange(e.target.value)} placeholder="e.g. Interval slot already fully reserved for emergency maintenance..." className="w-full px-3 py-2 text-sm rounded-xl bg-cinema-900 border border-cinema-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"/>
          </div>)}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-cinema-800 hover:bg-cinema-750 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all ${btnClasses} disabled:opacity-50`}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>);
};
