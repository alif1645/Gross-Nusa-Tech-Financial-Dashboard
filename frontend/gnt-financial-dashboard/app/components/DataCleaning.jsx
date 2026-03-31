import React, { useState, useEffect } from 'react';

export default function DataCleaning({ token, onCleanComplete }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [activeTab, setActiveTab] = useState('duplicates');

    const analyzeData = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/excel/analyze-data', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            if (data.success) {
                setAnalysis(data.data);
            }
        } catch (error) {
            console.error('Error analyzing data:', error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        analyzeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClean = async (action, recordIds = null) => {
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')}?`)) {
            return;
        }

        setCleaning(true);
        try {
            const response = await fetch('http://localhost:8000/api/excel/clean-data', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    record_ids: recordIds
                })
            });

            const data = await response.json();
            if (data.success) {
                alert(`Successfully cleaned ${data.data.cleaned_count} records`);
                analyzeData(); // Refresh analysis
                if (onCleanComplete) {
                    onCleanComplete();
                }
            } else {
                alert('Failed to clean data: ' + data.message);
            }
        } catch (error) {
            console.error('Error cleaning data:', error);
            alert('Error cleaning data');
        } finally {
            setCleaning(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const tabs = [
        { id: 'duplicates', label: 'Duplicates', icon: '🔄' },
        { id: 'missing', label: 'Missing Data', icon: '❓' },
        { id: 'outliers', label: 'Outliers', icon: '📊' },
        { id: 'dates', label: 'Date Issues', icon: '📅' }
    ];

    if (loading && !analysis) {
        return (
            <div className="bg-white rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyzing data...</p>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-600">No data to analyze. Please add some financial records first.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-purple-600 to-purple-800 text-white p-6">
                <h3 className="text-xl font-semibold mb-2">🧹 Data Cleaning Tool</h3>
                <p className="text-purple-100">
                    Found {Object.values(analysis.issues).reduce((sum, issue) => sum + issue.count, 0)} total issues
                    in {analysis.total_records} records
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition ${
                                activeTab === tab.id
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                            {analysis.issues[tab.id]?.count > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                    {analysis.issues[tab.id].count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
                {/* Duplicates Tab */}
                {activeTab === 'duplicates' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Duplicate Records Found
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {analysis.issues.duplicates.count} groups of duplicate records
                                </p>
                            </div>
                            {analysis.issues.duplicates.count > 0 && (
                                <button
                                    onClick={() => handleClean('remove_duplicates')}
                                    disabled={cleaning}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
                                >
                                    {cleaning ? 'Removing...' : 'Remove All Duplicates'}
                                </button>
                            )}
                        </div>

                        {analysis.issues.duplicates.count === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-lg">✓ No duplicates found</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {analysis.issues.duplicates.groups.map((group, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-red-50">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-red-900">
                                                {group.count} duplicates found
                                            </span>
                                            <button
                                                onClick={() => handleClean('remove_duplicates', group.ids)}
                                                disabled={cleaning}
                                                className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            <p><strong>Type:</strong> {group.sample.type}</p>
                                            <p><strong>Category:</strong> {group.sample.category}</p>
                                            <p><strong>Amount:</strong> {formatCurrency(group.sample.amount)}</p>
                                            <p><strong>Date:</strong> {group.sample.date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Missing Data Tab */}
                {activeTab === 'missing' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Missing Descriptions
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {analysis.issues.missing_descriptions.count} records without descriptions
                                </p>
                            </div>
                            {analysis.issues.missing_descriptions.count > 0 && (
                                <button
                                    onClick={() => handleClean('fill_descriptions')}
                                    disabled={cleaning}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
                                >
                                    {cleaning ? 'Filling...' : 'Auto-fill Descriptions'}
                                </button>
                            )}
                        </div>

                        {analysis.issues.missing_descriptions.count === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-lg">✓ All records have descriptions</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {analysis.issues.missing_descriptions.records.map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-sm">{record.type}</td>
                                                <td className="px-4 py-2 text-sm">{record.category}</td>
                                                <td className="px-4 py-2 text-sm">{formatCurrency(record.amount)}</td>
                                                <td className="px-4 py-2 text-sm">{record.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {analysis.issues.missing_descriptions.count > 10 && (
                                    <p className="text-sm text-gray-500 mt-2 text-center">
                                        Showing 10 of {analysis.issues.missing_descriptions.count} records
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Outliers Tab */}
                {activeTab === 'outliers' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Statistical Outliers
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {analysis.issues.outliers.count} records with unusual amounts
                                </p>
                                {analysis.issues.outliers.statistics && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mean: {formatCurrency(analysis.issues.outliers.statistics.mean)} | 
                                        Std Dev: {formatCurrency(analysis.issues.outliers.statistics.std_dev)}
                                    </p>
                                )}
                            </div>
                            {analysis.issues.outliers.count > 0 && (
                                <button
                                    onClick={() => handleClean('remove_outliers')}
                                    disabled={cleaning}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
                                >
                                    {cleaning ? 'Removing...' : 'Remove Outliers'}
                                </button>
                            )}
                        </div>

                        {analysis.issues.outliers.count === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-lg">✓ No outliers detected</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {analysis.issues.outliers.records.map((record, idx) => (
                                            <tr key={idx} className="bg-orange-50">
                                                <td className="px-4 py-2 text-sm">{record.type}</td>
                                                <td className="px-4 py-2 text-sm">{record.category}</td>
                                                <td className="px-4 py-2 text-sm font-bold text-orange-900">
                                                    {formatCurrency(record.amount)}
                                                </td>
                                                <td className="px-4 py-2 text-sm">{record.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Date Issues Tab */}
                {activeTab === 'dates' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900">
                                    Unusual Dates
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                    {analysis.issues.unusual_dates.count} records with future or very old dates
                                </p>
                            </div>
                            {analysis.issues.unusual_dates.count > 0 && (
                                <button
                                    onClick={() => handleClean('fix_dates')}
                                    disabled={cleaning}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 transition"
                                >
                                    {cleaning ? 'Fixing...' : 'Fix Date Issues'}
                                </button>
                            )}
                        </div>

                        {analysis.issues.unusual_dates.count === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-lg">✓ All dates look good</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Issue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {analysis.issues.unusual_dates.records.map((record, idx) => {
                                            const date = new Date(record.date);
                                            const now = new Date();
                                            const isFuture = date > now;
                                            
                                            return (
                                                <tr key={idx} className="bg-yellow-50">
                                                    <td className="px-4 py-2 text-sm">{record.type}</td>
                                                    <td className="px-4 py-2 text-sm">{record.category}</td>
                                                    <td className="px-4 py-2 text-sm">{formatCurrency(record.amount)}</td>
                                                    <td className="px-4 py-2 text-sm font-bold text-yellow-900">
                                                        {record.date}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-yellow-800">
                                                        {isFuture ? '⚠️ Future date' : '⚠️ Very old date'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Refresh Button */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
                <button
                    onClick={analyzeData}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                    🔄 Refresh Analysis
                </button>
            </div>
        </div>
    );
}
