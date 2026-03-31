'use client';

import React, { useState } from 'react';

export default function ExcelViewerEnhanced({ token }) {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [excelData, setExcelData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedSheet, setSelectedSheet] = useState(0);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setExcelData(null);
            setError(null);
        }
    };

    const handleViewFile = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/excel/view', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const text = await response.text();
            
            try {
                const data = JSON.parse(text);
                
                if (data.success) {
                    setExcelData(data.data);
                    setSelectedSheet(0);
                } else {
                    setError(data.message || 'Failed to load file');
                }
            } catch (parseError) {
                setError('Server returned invalid response');
                console.error('Parse error:', parseError);
            }
        } catch (err) {
            setError('Error loading file: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        return value.toString();
    };

    const downloadAsCSV = () => {
        if (!excelData || !excelData.sheets || excelData.sheets.length === 0) return;

        const sheet = excelData.sheets[selectedSheet];
        let csv = '';

        // Headers
        csv += sheet.headers.join(',') + '\n';

        // Data rows
        sheet.rows.forEach(row => {
            const rowData = sheet.headers.map(header => {
                const value = row[header] || '';
                // Escape commas and quotes
                if (value.toString().includes(',') || value.toString().includes('"')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value;
            });
            csv += rowData.join(',') + '\n';
        });

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace('.xlsx', '')}_${sheet.name}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-900">
                    📄 Excel File Viewer
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                    View any Excel file (.xlsx, .xls, .csv) regardless of its format or structure
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Any Excel File
                        </label>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                        />
                        {file && (
                            <p className="text-sm text-gray-600 mt-2">
                                📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleViewFile}
                        disabled={!file || loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {loading ? '⏳ Loading...' : '👁️ View File'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Excel Data Display */}
            {excelData && excelData.sheets && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* File Info Header */}
                    <div className="bg-linear-to-r from-blue-600 to-blue-800 text-white p-4">
                        <h4 className="font-semibold text-lg mb-2">📊 {excelData.filename}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="opacity-80">Sheets:</span>
                                <span className="ml-2 font-semibold">{excelData.sheets.length}</span>
                            </div>
                            <div>
                                <span className="opacity-80">Active:</span>
                                <span className="ml-2 font-semibold">{excelData.sheets[selectedSheet]?.name}</span>
                            </div>
                            <div>
                                <span className="opacity-80">Rows:</span>
                                <span className="ml-2 font-semibold">{excelData.sheets[selectedSheet]?.total_rows}</span>
                            </div>
                            <div>
                                <span className="opacity-80">Columns:</span>
                                <span className="ml-2 font-semibold">{excelData.sheets[selectedSheet]?.total_columns}</span>
                            </div>
                        </div>
                    </div>

                    {/* Sheet Tabs */}
                    {excelData.sheets.length > 1 && (
                        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
                            {excelData.sheets.map((sheet, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedSheet(index)}
                                    className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition ${
                                        selectedSheet === index
                                            ? 'bg-white text-blue-600 border-t-2 border-blue-600'
                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                >
                                    📋 {sheet.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            Viewing: <strong>{excelData.sheets[selectedSheet]?.name}</strong>
                        </p>
                        <button
                            onClick={downloadAsCSV}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                            💾 Download as CSV
                        </button>
                    </div>

                    {/* Tabel */}
                    <div className="overflow-x-auto max-h-150 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-200">
                                        #
                                    </th>
                                    {excelData.sheets[selectedSheet]?.headers.map((header, idx) => (
                                        <th
                                            key={idx}
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {excelData.sheets[selectedSheet]?.rows.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-500 font-mono bg-gray-50">
                                            {row._row_number || rowIdx + 1}
                                        </td>
                                        {excelData.sheets[selectedSheet]?.headers.map((header, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                                            >
                                                {formatValue(row[header])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Footer */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Showing {excelData.sheets[selectedSheet]?.rows.length} rows × {excelData.sheets[selectedSheet]?.headers.length} columns
                        </p>
                    </div>
                </div>
            )}

            {/* Features Info */}
            {!excelData && !loading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                    <p className="font-semibold text-blue-900 mb-2">✨ Features:</p>
                    <ul className="space-y-1 text-blue-800">
                        <li>• Mengecek file Excel apapun</li>
                        <li>• Support untuk setiap jenis format filr Excel sheets</li>
                        <li>• Download akan menjadi format CSV</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
