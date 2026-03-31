'use client';

import React, { useState } from 'react';

export default function CleanupButton({ token, onCleanupSuccess }) {
    const [loading, setLoading] = useState(false);

    const handleCleanup = async () => {
        if (!confirm('⚠️ WARNING: This will DELETE ALL financial records!\n\nAre you absolutely sure?')) {
            return;
        }

        if (!confirm('This action CANNOT be undone!\n\nClick OK to proceed with deletion.')) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/financial-records/delete-all', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ ${data.message}`);
                if (onCleanupSuccess) {
                    onCleanupSuccess();
                }
            } else {
                alert(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCleanup}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
        >
            {loading ? '🗑️ Deleting...' : '🗑️ Delete All Records'}
        </button>
    );
}
