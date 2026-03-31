import React from 'react';

export default function SummaryCards({ summary }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const cards = [
        {
            title: 'Total Pemasukan',
            value: formatCurrency(summary?.total_revenue),
            color: 'green',
            icon: '💰'
        },
        {
            title: 'Total Pengeluaran',
            value: formatCurrency(summary?.total_expenditure),
            color: 'red',
            icon: '💸'
        },
        {
            title: 'Net Profit',
            value: formatCurrency(summary?.net_profit),
            color: summary?.net_profit >= 0 ? 'blue' : 'orange',
            icon: summary?.net_profit >= 0 ? '📈' : '📉'
        }
    ];

    const colorClasses = {
        green: {
            bg: 'bg-green-50',
            text: 'text-green-800',
            border: 'border-green-200'
        },
        red: {
            bg: 'bg-red-50',
            text: 'text-red-800',
            border: 'border-red-200'
        },
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-800',
            border: 'border-blue-200'
        },
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-800',
            border: 'border-orange-200'
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, index) => {
                const colors = colorClasses[card.color];
                return (
                    <div
                        key={index}
                        className={`${colors.bg} ${colors.border} border-2 rounded-lg p-6 shadow-sm`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    {card.title}
                                </p>
                                <p className={`text-3xl font-bold ${colors.text}`}>
                                    {card.value}
                                </p>
                            </div>
                            <div className="text-4xl">
                                {card.icon}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
