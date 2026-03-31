<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinancialRecordHistory extends Model
{
    protected $table = 'financial_record_history';

    protected $fillable = [
        'financial_record_id',
        'action',
        'old_values',
        'new_values',
        'change_description',
        'user_id'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function financialRecord()
    {
        return $this->belongsTo(FinancialRecord::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
