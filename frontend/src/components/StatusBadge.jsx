import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Ban, CheckCheck } from 'lucide-react';
export const StatusBadge = ({ status, size = 'md' }) => {
    const sizeClasses = {
        sm: 'text-xs px-2.5 py-0.5',
        md: 'text-xs sm:text-sm px-3 py-1',
        lg: 'text-sm px-3.5 py-1.5 font-semibold',
    }[size];
    switch (status) {
        case 'PENDING':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#FFF0F7] text-[#9F2B68] border border-[#9F2B68]/30 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 animate-pulse text-[#9F2B68]"/>
          Pending Review
        </span>);
        case 'UNDER_REVIEW':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#F8F5FF] text-[#5D3FD3] border border-[#5D3FD3]/30 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-[#5D3FD3]"/>
          Under Review
        </span>);
        case 'ACCEPTED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#E6F9F0] text-emerald-700 border border-emerald-300 shadow-sm ${sizeClasses}`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600"/>
          Accepted
        </span>);
        case 'REJECTED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#FFF0F4] text-[#800020] border border-[#800020]/30 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-[#800020]"/>
          Rejected
        </span>);
        case 'EXPIRED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#FFF0F4] text-[#800020] border border-[#800020]/30 shadow-xs ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-[#800020]"/>
          Slot Occupied (Refunded)
        </span>);
        case 'CANCELLED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#F4F4F8] text-[#AA98A9] border border-[#CBC3E3] ${sizeClasses}`}>
          <Ban className="w-3.5 h-3.5 text-[#AA98A9]"/>
          Cancelled
        </span>);
        case 'COMPLETED':
            return (<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#FDF5FF] text-[#BF40BF] border border-[#BF40BF]/30 ${sizeClasses}`}>
          <CheckCheck className="w-3.5 h-3.5 text-[#BF40BF]"/>
          Screened / Completed
        </span>);
        default:
            return (<span className={`inline-flex rounded-full bg-[#E6E6FA] text-[#702963] border border-[#CBC3E3] font-medium ${sizeClasses}`}>
          {status}
        </span>);
    }
};
