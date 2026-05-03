'use client';

import React, { useState } from 'react';

export default function DataCleaning({ token, onCleanComplete }) {
    const [issues, setIssues] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const analyzeData = async () => {
        setAnalyzing(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/analyze-data`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            const data = await response.json();
            if (data.success) {
                setIssues(data.data.issues);
            } else {
                alert('Error analyzing data: ' + data.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
            console.error('Analyze error:', error);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleClean = async (action, recordIds) => {
        console.log('handleClean called with:', { action, recordIds, count: recordIds?.length });

        if (!recordIds || recordIds.length === 0) {
            alert('No records to clean');
            return;
        }

        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')} ${recordIds.length} record(s)?`)) {
            return;
        }

        setLoading(true);
        try {
            const requestBody = {
                action: action,
                record_ids: recordIds
            };

            console.log('Sending request:', requestBody);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/clean-data`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Response:', data);

            if (data.success) {
                alert(`✅ ${data.message}`);
                analyzeData(); // Refresh analysis
                if (onCleanComplete) {
                    onCleanComplete();
                }
            } else {
                alert('❌ Error: ' + data.message);
            }
        } catch (error) {
            alert('❌ Error: ' + error.message);
            console.error('Clean error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Analyze Button */}
            <div>
                <button
                    onClick={analyzeData}
                    disabled={analyzing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition"
                >
                    {analyzing ? 'Mencari...' : 'Cari masalah di data'}
                </button>
            </div>

            {/* Results */}
            {issues && (
                <div className="space-y-6">
                    {/* Duplicates */}
                    {issues.duplicates && issues.duplicates.count > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-red-900">
                                    🔄 Duplicates ({issues.duplicates.count} groups)
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {issues.duplicates.groups.map((group, idx) => {
                                    const recordIds = group.records.map(r => r.id);
                                    console.log('Duplicate group', idx, 'has IDs:', recordIds);

                                    return (
                                        <div key={idx} className="border border-red-200 rounded p-4 bg-red-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-semibold text-red-900">
                                                        {group.count} identical records found
                                                    </p>
                                                    {group.sample && (
                                                        <div className="text-sm text-gray-700 mt-2">
                                                            <p><strong>Type:</strong> {group.sample.type}</p>
                                                            <p><strong>Category:</strong> {group.sample.category}</p>
                                                            <p><strong>Amount:</strong> {formatCurrency(group.sample.amount)}</p>
                                                            <p><strong>Date:</strong> {group.sample.date}</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleClean('remove_duplicates', recordIds)}
                                                    disabled={loading}
                                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                                                >
                                                    Remove Duplicates
                                                </button>
                                            </div>
                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                                    Show all {group.count} records (IDs: {recordIds.join(', ')})
                                                </summary>
                                                <div className="mt-2 space-y-1">
                                                    {group.records.map((record, ridx) => (
                                                        <div key={ridx} className="text-gray-600">
                                                            ID: {record.id} - {record.type} - {record.category} - {formatCurrency(record.amount)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Missing Descriptions */}
                    {issues.missing_descriptions && issues.missing_descriptions.count > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-yellow-900">
                                    📝 Missing Descriptions ({issues.missing_descriptions.count} records)
                                </h3>
                                <button
                                    onClick={() => {
                                        const ids = issues.missing_descriptions.records.map(r => r.id);
                                        console.log('Auto-fill IDs:', ids);
                                        handleClean('fill_descriptions', ids);
                                    }}
                                    disabled={loading}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded disabled:opacity-50"
                                >
                                    Auto-Fill All
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {issues.missing_descriptions.records.slice(0, 10).map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-sm">{record.id}</td>
                                                <td className="px-4 py-2 text-sm">{record.type}</td>
                                                <td className="px-4 py-2 text-sm">{record.category}</td>
                                                <td className="px-4 py-2 text-sm">{formatCurrency(record.amount)}</td>
                                                <td className="px-4 py-2 text-sm">{record.date}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {issues.missing_descriptions.count > 10 && (
                                    <p className="text-sm text-gray-500 mt-2">
                                        Showing 10 of {issues.missing_descriptions.count} records
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Outliers */}
                    {issues?.outliers && issues.outliers.count > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-orange-900">
                                    📊 Outliers ({issues.outliers.count} records)
                                </h3>
                                <button
                                    onClick={() => {
                                        const ids = issues.outliers.records.map(r => r.id);
                                        console.log('Delete outlier IDs:', ids);
                                        handleClean('delete_records', ids);
                                    }}
                                    disabled={loading}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded disabled:opacity-50"
                                >
                                    Delete All Outliers
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Deviation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {issues.outliers.records.map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-sm">{record.id}</td>
                                                <td className="px-4 py-2 text-sm">{record.type}</td>
                                                <td className="px-4 py-2 text-sm">{record.category}</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-orange-600">
                                                    {formatCurrency(record.amount)}
                                                </td>
                                                <td className="px-4 py-2 text-sm">{record.deviation || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Unusual Dates */}
                    {issues?.unusual_dates && issues.unusual_dates.count > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-purple-900">
                                    📅 Unusual Dates ({issues.unusual_dates.count} records)
                                </h3>
                                <button
                                    onClick={() => {
                                        const ids = issues.unusual_dates.records.map(r => r.id);
                                        console.log('Delete unusual date IDs:', ids);
                                        handleClean('delete_records', ids);
                                    }}
                                    disabled={loading}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded disabled:opacity-50"
                                >
                                    Delete All Unusual Dates
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Issue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {issues.unusual_dates.records.map((record, idx) => (
                                            <tr key={idx}>
                                                <td className="px-4 py-2 text-sm">{record.id}</td>
                                                <td className="px-4 py-2 text-sm">{record.type}</td>
                                                <td className="px-4 py-2 text-sm">{record.category}</td>
                                                <td className="px-4 py-2 text-sm">{formatCurrency(record.amount)}</td>
                                                <td className="px-4 py-2 text-sm font-semibold text-purple-600">
                                                    {record.date}
                                                </td>
                                                <td className="px-4 py-2 text-sm">{record.issue}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* No Issues Found */}
                    {issues && 
                     (issues.duplicates?.count || 0) === 0 &&
                     (issues.missing_descriptions?.count || 0) === 0 &&
                     (issues.outliers?.count || 0) === 0 &&
                     (issues.unusual_dates?.count || 0) === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <p className="text-green-900 text-lg font-semibold">
                                ✅ No data quality issues found!
                            </p>
                            <p className="text-green-700 text-sm mt-2">
                                Your data is clean and ready to use.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Initial State */}
            {!issues && !analyzing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-900 text-lg font-semibold mb-2">
                        Click Analyze Data Quality to scan for issues
                    </p>
                    <p className="text-blue-700 text-sm">
                        This will check for duplicates, missing descriptions, outliers, and unusual dates
                    </p>
                </div>
            )}
        </div>
    );
}