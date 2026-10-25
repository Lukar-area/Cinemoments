import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Ban, CheckCheck } from 'lucide-react';
export const StatusBadge = ({ status, size = 'md' }) => {
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-xs sm:text-sm px-2.5 py-1',
        lg: 'text-sm px-3.5 py-1.5 font-semibold',
    }[size];
    switch (status) {
        case 'PENDING':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 animate-pulse"/>
          Pending Review
        </span>);
        case 'UNDER_REVIEW':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5"/>
          Under Review
        </span>);
        case 'ACCEPTED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20 ${sizeClasses}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400"/>
          Accepted
        </span>);
        case 'REJECTED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/30 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5"/>
          Rejected
        </span>);
        case 'EXPIRED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70"/>
          Expired Slot
        </span>);
        case 'CANCELLED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700 ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5"/>
          Cancelled
        </span>);
        case 'COMPLETED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 ${sizeClasses}`}>
          <CheckCheck className="w-3.5 h-3.5"/>
          Screened / Completed
        </span>);
        default:
            return (<span className={`inline-flex rounded-full bg-slate-800 text-slate-400 ${sizeClasses}`}>
          {status}
        </span>);
    }
};
