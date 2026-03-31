import React, { useState } from 'react';

export default function PivotTable({ token }) {
    const [config, setConfig] = useState({
        row_field: 'category',
        column_field: '',
        value_field: 'amount',
        aggregation: 'sum',
        start_date: '',
        end_date: ''
    });
    const [pivotData, setPivotData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fieldOptions = [
        { value: 'type', label: 'Type' },
        { value: 'category', label: 'Category' },
        { value: 'date_year', label: 'Year' },
        { value: 'date_month', label: 'Month' },
        { value: 'date_quarter', label: 'Quarter' }
    ];

    const aggregationOptions = [
        { value: 'sum', label: 'Sum' },
        { value: 'avg', label: 'Average' },
        { value: 'count', label: 'Count' },
        { value: 'min', label: 'Minimum' },
        { value: 'max', label: 'Maximum' }
    ];

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams(config);
            const response = await fetch(`/api/excel/pivot?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            if (data.success) {
                setPivotData(data.data);
            }
        } catch (error) {
            console.error('Error generating pivot:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const formatValue = (value) => {
        if (config.value_field === 'amount' && config.aggregation !== 'count') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(value);
        }
        return value.toLocaleString();
    };

    const exportToCSV = () => {
        if (!pivotData) return;

        let csv = '';
        
        if (pivotData.type === 'one_dimensional') {
            // Header
            csv += `${pivotData.row_field},${config.aggregation}(${config.value_field}),count\n`;
            
            // Data
            pivotData.data.forEach(row => {
                csv += `${row[pivotData.row_field]},${row.value},${row.count}\n`;
            });
        } else {
            // Two-dimensional
            csv += `${pivotData.row_field},${pivotData.columns.join(',')}\n`;
            
            pivotData.data.forEach(row => {
                const rowData = [row[pivotData.row_field]];
                pivotData.columns.forEach(col => {
                    rowData.push(row[col] || 0);
                });
                csv += rowData.join(',') + '\n';
            });
        }

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pivot_table_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-indigo-600 to-indigo-800 text-white p-6">
                <h3 className="text-xl font-semibold mb-2">📊 Pivot Table Generator</h3>
                <p className="text-indigo-100">
                    Analyze your financial data from different perspectives
                </p>
            </div>

            {/* Konfigurasi */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* untuk Baris */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Row Field *
                        </label>
                        <select
                            value={config.row_field}
                            onChange={(e) => handleConfigChange('row_field', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {fieldOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Untuk Kolom */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Column Field (Optional)
                        </label>
                        <select
                            value={config.column_field}
                            onChange={(e) => handleConfigChange('column_field', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="">None</option>
                            {fieldOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Agregasi */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Aggregation *
                        </label>
                        <select
                            value={config.aggregation}
                            onChange={(e) => handleConfigChange('aggregation', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {aggregationOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={config.start_date}
                            onChange={(e) => handleConfigChange('start_date', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={config.end_date}
                            onChange={(e) => handleConfigChange('end_date', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition"
                    >
                        {loading ? 'Generating...' : '🔄 Generate Pivot Table'}
                    </button>

                    {pivotData && (
                        <button
                            onClick={exportToCSV}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
                        >
                            📥 Export to CSV
                        </button>
                    )}
                </div>
            </div>

            {/* Hasil Pivot */}
            {pivotData && (
                <div className="p-6">
                    <div className="mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">
                            Pivot Results
                        </h4>
                        <p className="text-sm text-gray-600">
                            {pivotData.type === 'one_dimensional' ? 'Simple' : 'Cross-tab'} pivot table
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        {pivotData.type === 'one_dimensional' ? (
                            // One-dimensional pivot
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider">
                                            {pivotData.row_field}
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-indigo-900 uppercase tracking-wider">
                                            {config.aggregation} ({config.value_field})
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-indigo-900 uppercase tracking-wider">
                                            Count
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pivotData.data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {row[pivotData.row_field]}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                                                {formatValue(row.value)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                                                {row.count}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-indigo-100">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-bold text-indigo-900">
                                            TOTAL
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-right text-indigo-900">
                                            {formatValue(pivotData.data.reduce((sum, row) => sum + row.value, 0))}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-right text-indigo-900">
                                            {pivotData.data.reduce((sum, row) => sum + row.count, 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        ) : (
                            // Two-dimensional pivot
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-indigo-900 uppercase tracking-wider sticky left-0 bg-indigo-50">
                                            {pivotData.row_field}
                                        </th>
                                        {pivotData.columns.map((col, idx) => (
                                            <th key={idx} className="px-6 py-3 text-right text-xs font-medium text-indigo-900 uppercase tracking-wider">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pivotData.data.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                                                {row[pivotData.row_field]}
                                            </td>
                                            {pivotData.columns.map((col, colIdx) => (
                                                <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                                    {formatValue(row[col] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {!pivotData && !loading && (
                <div className="p-12 text-center text-gray-500">
                    <p className="text-lg">Configure and generate your pivot table above</p>
                </div>
            )}
        </div>
    );
}
