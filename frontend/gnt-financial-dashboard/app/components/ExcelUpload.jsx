'use client';

import React, { useState } from 'react';

export default function ExcelUpload({ token, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_URL}/api/excel/upload`, {
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
                    setResult(data);
                    alert(`✅ ${data.message}`);
                    setFile(null);
                    document.getElementById('excel-file-input').value = '';
                    if (onUploadSuccess) {
                        onUploadSuccess();
                    }
                } else {
                    setResult(data);
                    setError(data.message);
                }
            } catch (parseError) {
                setError('Server returned invalid response');
                console.error('Parse error:', parseError);
            }

        } catch (err) {
            setError('Network error: ' + err.message);
            console.error('Error:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.open(`${API_URL}/excel/template`, '_blank');
    };

    const handleExport = () => {
        window.open(`${API_URL}/excel/export`, '_blank');
    };

    return (
        <div className="space-y-4">
            {/* File Upload */}
            <div className="flex items-center space-x-4">
                <div className="flex-1">
                    <label htmlFor="excel-file-input" className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Excel File (.xlsx, .xls, .csv)
                    </label>
                    <input
                        id="excel-file-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                    />
                    {file && (
                        <p className="text-sm text-gray-600 mt-1">
                            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    {uploading ? 'Uploading...' : '📤 Upload & Import'}
                </button>

                <button
                    onClick={handleDownloadTemplate}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                >
                    📥 Download Template
                </button>

                <button
                    onClick={handleExport}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                >
                    📊 Export Current Data
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-semibold text-red-900 mb-2">❌ Error:</p>
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Hasil Import */}
            {result && result.data && (
                <div className={`border rounded-lg p-4 ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'
                }`}>
                    <div className="mb-3">
                        <p className="font-semibold mb-1">
                            {result.success ? '✅ Import Results' : '⚠️ Import Results'}
                        </p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Total Rows:</span>
                                <span className="ml-2 font-semibold">{result.data.total_rows}</span>
                            </div>
                            <div>
                                <span className="text-green-600">Imported:</span>
                                <span className="ml-2 font-semibold text-green-700">{result.data.imported}</span>
                            </div>
                            <div>
                                <span className="text-orange-600">Skipped:</span>
                                <span className="ml-2 font-semibold text-orange-700">{result.data.skipped}</span>
                            </div>
                        </div>
                    </div>

                    {/* Show Errors */}
                    {result.data.errors && result.data.errors.length > 0 && (
                        <div className="mt-3 border-t pt-3">
                            <p className="font-semibold text-red-900 mb-2">
                                Validation Errors (showing first 10):
                            </p>
                            <div className="bg-white rounded border border-red-200 p-3 max-h-48 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-1 px-2">Row</th>
                                            <th className="text-left py-1 px-2">Error</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.data.errors.map((err, idx) => (
                                            <tr key={idx} className="border-b">
                                                <td className="py-1 px-2 font-mono text-gray-600">
                                                    {err.row}
                                                </td>
                                                <td className="py-1 px-2 text-red-700">
                                                    {err.error}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">📝 Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Download the template to see the correct format</li>
                    <li>Fill in your data following these rules:
                        <ul className="list-disc list-inside ml-6 mt-1">
                            <li><strong>Type:</strong> Must be revenue or expenditure (lowercase)</li>
                            <li><strong>Category:</strong> Must be TEXT (e.g., Sales, Rent), not numbers</li>
                            <li><strong>Amount:</strong> Must be a positive number</li>
                            <li><strong>Date:</strong> Use format YYYY-MM-DD or M/D/YYYY</li>
                        </ul>
                    </li>
                    <li>Upload the file and check for errors</li>
                    <li>Only valid rows will be imported</li>
                </ol>
            </div>
        </div>
    );
}
