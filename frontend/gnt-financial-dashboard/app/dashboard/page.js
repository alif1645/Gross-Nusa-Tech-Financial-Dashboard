'use client';

import ProtectedRoute from '../Components/ProtectedRoute';
import Dashboard from '../pages/DashboardEnhanced';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    );
}