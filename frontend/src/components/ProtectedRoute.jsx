import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (<div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#9F2B68]/20 border-t-[#9F2B68] rounded-full animate-spin"/>
        <p className="mt-4 text-sm text-[#483248] font-mono">Verifying session...</p>
      </div>);
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace/>;
    }
    return <>{children}</>;
};
