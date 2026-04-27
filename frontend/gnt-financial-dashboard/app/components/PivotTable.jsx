'use client';

import React, { useState } from 'react';

export default function PivotTable({ token }) {
    const [rowField, setRowField] = useState('category');
    const [columnField, setColumnField] = useState('');
    const [aggregation, setAggregation] = useState('sum');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const generatePivot = async () => {
        setLoading(true);
        try {
            const groupBy = rowField;
            const aggregate = aggregation;

            const url = `${API_URL}/api/excel/pivot?group_by=${groupBy}&aggregate=${aggregate}`;
            
            console.log('Fetching pivot from:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            console.log('Response status:', response.status);

            const text = await response.text();
            console.log('Response text:', text.substring(0, 200));

            const data = JSON.parse(text);
            console.log('Parsed data:', data);

            if (data.success) {
                setResults(data.data);
            } else {
                alert('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Pivot error:', error);
            alert('Error generating pivot: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!results || !results.rows) return;

        const headers = ['Label', 'Value', 'Count'];
        const rows = results.rows.map(row => [
            row.label,
            row.value,
            row.count
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pivot_${rowField}_${aggregation}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
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
            {/* Pivot Table Generator */}
            <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">📊</span>
                    <h3 className="text-2xl font-bold text-white">Pivot Table Generator</h3>
                </div>
                <p className="text-indigo-100">
                    Analyze your financial data from different perspectives
                </p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Row Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Row Field <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={rowField}
                            onChange={(e) => setRowField(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="category">Category</option>
                            <option value="type">Type</option>
                            <option value="year">Year</option>
                            <option value="month">Month</option>
                            <option value="quarter">Quarter</option>
                        </select>
                    </div>

                    {/* Aggregation */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aggregation <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={aggregation}
                            onChange={(e) => setAggregation(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="sum">Sum</option>
                            <option value="avg">Average</option>
                            <option value="count">Count</option>
                            <option value="min">Minimum</option>
                            <option value="max">Maximum</option>
                        </select>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generatePivot}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition font-medium"
                >
                    {loading ? '⏳ Generating...' : '📊 Generate Pivot Table'}
                </button>
            </div>

            {/* Results */}
            {results && (
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                            Results: {rowField} by {aggregation}
                        </h3>
                        <button
                            onClick={downloadCSV}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                        >
                            📥 Download CSV
                        </button>
                    </div>

                    {/* Summary */}
                    {results.summary && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Total Records:</span>
                                    <span className="ml-2 font-semibold">{results.summary.total_records}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Total Groups:</span>
                                    <span className="ml-2 font-semibold">{results.summary.total_groups}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {rowField}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {aggregation}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Count
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.rows && results.rows.length > 0 ? (
                                    results.rows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {row.label}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {aggregation === 'count' ? 
                                                    row.value : 
                                                    formatCurrency(row.value)
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {row.count} records
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                            No data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Help Text */}
            {!results && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <p className="text-gray-600 text-lg">
                        Configure and generate your pivot table above
                    </p>
                </div>
            )}
        </div>
    );
}