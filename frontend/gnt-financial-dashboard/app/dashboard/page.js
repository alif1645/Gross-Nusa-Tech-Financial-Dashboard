'use client';

import ProtectedRoute from '../components/ProtectedRoute';
import Dashboard from '../pages/DashboardEnhanced';

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    );
}