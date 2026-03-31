<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExcelUpload extends Model
{
    protected $fillable = [
        'filename',
        'original_filename',
        'file_path',
        'total_rows',
        'imported_rows',
        'failed_rows',
        'validation_errors',
        'status',
        'user_id'
    ];

    protected $casts = [
        'validation_errors' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
