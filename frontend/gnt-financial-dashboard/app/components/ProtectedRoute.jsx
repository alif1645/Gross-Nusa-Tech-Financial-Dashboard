'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedRoute({ children }) {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const loggedIn = localStorage.getItem('isLoggedIn');
            const loginTime = localStorage.getItem('loginTime');
            
            // Cek sesi login
            const now = Date.now();
            const sessionDuration = 24 * 60 * 60 * 1000; // 24 jam dalam milidetik
            
            if (loggedIn === 'true' && loginTime) {
                const timeElapsed = now - parseInt(loginTime);
                
                if (timeElapsed < sessionDuration) {
                    // Valid session
                    setIsAuthenticated(true);
                    setIsChecking(false);
                } else {
                    // Session expired
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('loginTime');
                    router.replace('/'); // Use replace to prevent back button bypass
                    setIsChecking(false);
                }
            } else {
                // Tidak logged in
                router.replace('/');
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isChecking) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}