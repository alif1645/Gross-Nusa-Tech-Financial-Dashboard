import React, { useState } from 'react';

export default function FinancialTable({ records, meta, token, onPageChange, onRecordDeleted, onViewHistory }) {
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this record?');
    
        if (!confirmDelete) {
            return; // User cancelled
        }
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial-records/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            
            if (data.success) {
                window.alert('Record deleted successfully');
                if(onRecordDeleted) {
                    onRecordDeleted(id);
                }
            } else {
                window.alert('Error: ${data.message');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            window.alert('Error: ${error.message}');
        } finally {
            setDeletingId(null);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTypeColor = (type) => {
        return type === 'revenue' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800';
    };

    if (records.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No financial records found</p>
                <p className="text-sm mt-2">Upload an Excel file or add records manually</p>
            </div>
        );
    }

    return (
        <div>
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(record.type)}`}>
                                        {record.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {record.category}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {formatCurrency(record.amount)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {record.description || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(record.date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    {onViewHistory && (
                                        <button
                                            onClick={() => onViewHistory(record.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            History
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(record.id)}
                                        disabled={deletingId === record.id}
                                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                    >
                                        {deletingId === record.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => onPageChange(meta.current_page - 1)}
                            disabled={meta.current_page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => onPageChange(meta.current_page + 1)}
                            disabled={meta.current_page === meta.last_page}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{meta.current_page}</span> of{' '}
                                <span className="font-medium">{meta.last_page}</span>
                                {' '}({meta.total} total records)
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    onClick={() => onPageChange(meta.current_page - 1)}
                                    disabled={meta.current_page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => onPageChange(meta.current_page + 1)}
                                    disabled={meta.current_page === meta.last_page}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
