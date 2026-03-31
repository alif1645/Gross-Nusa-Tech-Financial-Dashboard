import React from 'react';

export default function FilterBar({ filters, onFilterChange }) {
    const handleChange = (field, value) => {
        onFilterChange({ [field]: value });
    };

    const handleReset = () => {
        onFilterChange({
            type: '',
            start_date: '',
            end_date: ''
        });
    };

    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
            <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                        </label>
                        <select
                            value={filters.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">All Types</option>
                            <option value="revenue">Revenue</option>
                            <option value="expenditure">Expenditure</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={filters.start_date}
                            onChange={(e) => handleChange('start_date', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={filters.end_date}
                            onChange={(e) => handleChange('end_date', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>

                    {/* Reset Button */}
                    <div className="flex items-end">
                        <button
                            onClick={handleReset}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
