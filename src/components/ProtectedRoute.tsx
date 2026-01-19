import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

const ProtectedRoute: React.FC = () => {
    const { session, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="w-64">
                    <SkeletonLoader count={3} />
                </div>
            </div>
        );
    }

    // Allow access if session exists OR if we are in localhost (dev mode)
    // This allows editing without logging in locally.
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!session && !isDev) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
