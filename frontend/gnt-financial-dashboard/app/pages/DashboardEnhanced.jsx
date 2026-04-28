'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import FinancialTable from '../components/FinancialTable';
import SummaryCards from '../components/SummaryCards';
import ExcelUpload from '../components/ExcelUpload'
import ExcelViewer from '../components/ExcelViewer';
import DataCleaning from '../components/DataCleaning';
import PivotTable from '../components/PivotTable';
import FilterBar from '../components/FilterBar';
import RecordHistory from '../components/RecordHistory';
import LogoutButton from '../components/LogoutButton';
import CleanupButton from '../components/CleanupButton';

export default function Dashboard() {
    const auth = {
        user: {
            name: 'admin',
            email: 'demo@example.com'
        },
        token: 'demo-token-12345'
    };

    const [records, setRecords] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        per_page: 50,
        total: 0,
        last_page: 1
    });
    const [summary, setSummary] = useState({
        total_revenue: 0,
        total_expenditure: 0,
        net_profit: 0
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        start_date: '',
        end_date: '',
        page: 1,
        per_page: 50
    });
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'excel-viewer', label: 'View Excel', icon: '📄' },
        { id: 'upload', label: 'Import Data', icon: '📤' },
        { id: 'cleaning', label: 'Data Cleaning', icon: '🧹' },
        { id: 'pivot', label: 'Pivot Analysis', icon: '📈' },
    ];

    // Fetch records from API
    const fetchRecords = async (filterParams = filters) => {
        try {
            const params = new URLSearchParams(
                Object.entries(filterParams).filter(([_, v]) => v)
            );
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial-records?${params}`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch records');
            }

            const data = await response.json();
            if (data.success) {
                setRecords(data.data || []);
                setMeta(data.meta || meta);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
            setRecords([]);
        }
    };

    // Summary stats
    const fetchSummary = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial-summary`, {
                headers: {
                    'Authorization': `Bearer ${auth.token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }

            const data = await response.json();
            if (data.success) {
                setSummary(data.data || summary);
            }
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    // Auto-load data 
    useEffect(() => {
        if (isInitialLoad) {
            fetchRecords();
            fetchSummary();
            setIsInitialLoad(false);
        }
    }, [isInitialLoad]);

    const handleFilterChange = (newFilters) => {
        const updatedFilters = { ...filters, ...newFilters, page: 1 };
        setFilters(updatedFilters);
        fetchRecords(updatedFilters);
    };

    const handlePageChange = (page) => {
        const updatedFilters = { ...filters, page };
        setFilters(updatedFilters);
        fetchRecords(updatedFilters);
    };

    const handleRecordDeleted = (id) => {
        setRecords(prev => prev.filter(record => record.id !== id));
        fetchSummary();
    };

    const handleUploadSuccess = () => {
        fetchRecords();
        fetchSummary();
    };

    const handleCleanComplete = () => {
        fetchRecords();
        fetchSummary();
    };

    const handleViewHistory = (recordId) => {
        setSelectedRecordId(recordId);
    };

    const handleCleanupSuccess = () => {
        fetchRecords();
        fetchSummary();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">
                                <div className='flex items-center gap-2'>
                                    <Image src="/gross-nusa-tech-logo.png" alt="Logo GNT" width={50} height={50} />
                                    <p>Gross Nusa Tech</p>
                                </div>
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-700">{auth.user.name}</span>
                            <LogoutButton />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Financial Dashboard
                    </h2>
                </div>
            </header>

            {/* Main Content */}
            <main className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Summary Cards */}
                    <SummaryCards summary={summary} />

                    {/* Tab Navigation */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition ${
                                            activeTab === tab.id
                                                ? 'border-blue-600 text-blue-600 bg-blue-50'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6">
                            {/* Bagian Overview */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Filter Bar */}
                                    <FilterBar 
                                        filters={filters}
                                        onFilterChange={handleFilterChange}
                                    />

                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-semibold">
                                            Financial Records
                                        </h3>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => fetchRecords()}
                                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                                            >
                                                🔄 Refresh Data
                                            </button>
                                            <CleanupButton 
                                                token={auth.token} 
                                                onCleanupSuccess={handleCleanupSuccess}
                                            />
                                        </div>
                                    </div>

                                    {/* Tabel Financial Records */}
                                    <FinancialTable
                                        records={records}
                                        meta={meta}
                                        token={auth.token}
                                        onPageChange={handlePageChange}
                                        onRecordDeleted={handleRecordDeleted}
                                        onViewHistory={handleViewHistory}
                                    />
                                </div>
                            )}

                            {/* Bagian Excel Viewer */}
                            {activeTab === 'excel-viewer' && (
                                <ExcelViewer token={auth.token} />
                            )}

                            {/* Bagian Upload File */}
                            {activeTab === 'upload' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            Import Financial Data
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Upload Excel files to bulk import your financial records. 
                                            You can validate and clean the data before importing.
                                        </p>
                                    </div>
                                    <ExcelUpload 
                                        token={auth.token}
                                        onUploadSuccess={handleUploadSuccess}
                                    />
                                </div>
                            )}

                            {/* Bagian Data Cleaning */}
                            {activeTab === 'cleaning' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            Data Cleaning
                                        </h3> 
                                        <p className="text-gray-600 text-sm">
                                            Membersihkan masalah-masalah di data yang telah <strong>telah diupload</strong>, seperti: 
                                            duplikat, deskripsi record yang kosong, outlier, and penanggalan yang tidak biasa.
                                        </p>
                                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                                            <strong>Note:</strong> Cuma berlaku untuk data yang telah ada di dalam database.
                                        </div>
                                    </div>
                                    <DataCleaning 
                                        token={auth.token}
                                        onCleanComplete={handleCleanComplete}
                                    />
                                </div>
                            )}

                            {/* Bagian Pivot Analysis */}
                            {activeTab === 'pivot' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">
                                            Pivot Analysis
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Membuat tabel custom untuk keperluan pivot data.
                                        </p>
                                    </div>
                                    <PivotTable token={auth.token} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Section */}
                    <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="font-semibold text-blue-900 mb-3">💡 Masing-Masing Section </h4>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li>
                                <strong>View Excel:</strong> Preview file Excel sebelum di-import untuk memastikan jika formatnya cocok.
                            </li>
                            <li>
                                <strong>Import Data:</strong> Section untuk mengupload file Excel. Baris yang punya error akan di-skip, sisanya akan direview oleh sistem.
                            </li>
                            <li>
                                <strong>Data Cleaning:</strong> Membersihkan data yang telah diupload ke database.
                            </li>
                            <li>
                                <strong>Pivot Analysis:</strong> Membuat pivot dengan mengelompokkan data dengan cara sesuai kemauan.
                            </li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* Record History Modal */}
            {selectedRecordId && (
                <RecordHistory
                    recordId={selectedRecordId}
                    token={auth.token}
                    onClose={() => setSelectedRecordId(null)}
                />
            )}
        </div>
    );
}