'use client';

import React, { useState } from 'react';

export default function ExcelUpload({ token, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setDebugInfo(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setUploading(true);
        setError(null);
        setDebugInfo(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('📤 Uploading to:', `${process.env.NEXT_PUBLIC_API_URL}/excel/upload`);
            console.log('📁 File:', file.name, file.type, file.size);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/excel/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response headers:', [...response.headers.entries()]);

            // Get the raw text first
            const text = await response.text();
            console.log('📥 Raw response:', text.substring(0, 500));

            // Try to parse as JSON
            try {
                const data = JSON.parse(text);
                console.log('✅ Parsed JSON:', data);

                if (data.success) {
                    alert(`Success! Imported ${data.data.imported} records`);
                    setFile(null);
                    if (onUploadSuccess) {
                        onUploadSuccess();
                    }
                    document.getElementById('excel-file-input').value = '';
                } else {
                    setError(data.message || 'Upload failed');
                    setDebugInfo({
                        status: response.status,
                        data: data
                    });
                }
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                setError('Server returned invalid JSON');
                setDebugInfo({
                    status: response.status,
                    contentType: response.headers.get('content-type'),
                    body: text.substring(0, 1000),
                    parseError: parseError.message
                });
            }

        } catch (err) {
            console.error('❌ Fetch Error:', err);
            setError('Network error: ' + err.message);
            setDebugInfo({
                error: err.message,
                type: err.name
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDownloadTemplate = () => {
        // Open in new tab for download
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/excel/template`, '_blank');
    };

    const handleExport = () => {
        // Open in new tab for download
        window.open(`${process.env.NEXT_PUBLIC_API_URL}/excel/export`, '_blank');
    };

    return (
        <div className="space-y-4">
            {/* File Upload Section */}
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

            {/* Action Buttons */}
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                    <p className="text-gray-400 mb-2">Debug Information:</p>
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="font-semibold text-blue-900 mb-2">📝 Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Download template to see correct format</li>
                    <li>Fill in your data</li>
                    <li>Upload the file</li>
                    <li>Check browser console (F12) for detailed logs</li>
                </ol>
            </div>
        </div>
    );
}
