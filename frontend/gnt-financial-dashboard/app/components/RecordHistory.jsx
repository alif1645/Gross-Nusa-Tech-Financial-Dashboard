import React, { useState } from 'react';

export default function RecordHistory({ recordId, token, onClose }) {
    const [history, setHistory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/financial-records/${recordId}/history`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            if (data.success) {
                setHistory(data.data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };
        
        fetchHistory();
    }, [recordId, token]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'created': return '✨';
            case 'updated': return '✏️';
            case 'deleted': return '🗑️';
            case 'cleaned': return '🧹';
            default: return '📝';
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'created': return 'bg-green-100 text-green-800 border-green-200';
            case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
            case 'cleaned': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const renderValueComparison = (oldValues, newValues) => {
        if (!oldValues && !newValues) return null;

        const allKeys = new Set([
            ...Object.keys(oldValues || {}),
            ...Object.keys(newValues || {})
        ]);

        const changedFields = Array.from(allKeys).filter(key => {
            return oldValues?.[key] !== newValues?.[key];
        });

        if (changedFields.length === 0) return null;

        return (
            <div className="mt-3 space-y-2">
                {changedFields.map(field => (
                    <div key={field} className="text-sm">
                        <span className="font-semibold text-gray-700">{field}:</span>
                        <div className="ml-4 flex items-center gap-2">
                            {oldValues?.[field] && (
                                <span className="bg-red-50 text-red-700 px-2 py-1 rounded line-through">
                                    {JSON.stringify(oldValues[field])}
                                </span>
                            )}
                            <span className="text-gray-400">→</span>
                            {newValues?.[field] && (
                                <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-semibold">
                                    {JSON.stringify(newValues[field])}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading history...</p>
                </div>
            </div>
        );
    }

    if (!history) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-2">📜 Record History</h3>
                            <p className="text-blue-100 text-sm">
                                Tracking all changes for record #{recordId}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Record</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <span className="text-xs text-gray-500">Type</span>
                            <p className="font-medium">{history.record.type}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Category</span>
                            <p className="font-medium">{history.record.category}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Amount</span>
                            <p className="font-medium">${history.record.amount}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Date</span>
                            <p className="font-medium">{history.record.date}</p>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500">Source</span>
                            <p className="font-medium">{history.record.source}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                        Change History ({history.history.length} events)
                    </h4>

                    {history.history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <p>No history available for this record</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.history.map((event, idx) => (
                                <div
                                    key={event.id}
                                    className={`border-2 rounded-lg p-4 ${getActionColor(event.action)}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <span className="text-2xl">{getActionIcon(event.action)}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-sm uppercase">
                                                        {event.action}
                                                    </span>
                                                    <span className="text-xs text-gray-600">
                                                        {formatDate(event.created_at)}
                                                    </span>
                                                </div>
                                                
                                                {event.change_description && (
                                                    <p className="text-sm mb-2">
                                                        {event.change_description}
                                                    </p>
                                                )}

                                                {event.user && (
                                                    <p className="text-xs text-gray-600">
                                                        By: {event.user.name}
                                                    </p>
                                                )}

                                                {renderValueComparison(event.old_values, event.new_values)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
