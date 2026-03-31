<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FinancialRecordController;
use App\Http\Controllers\ExcelController;
use Illuminate\Support\Facades\Auth;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route to verify API is working
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working!'
    ]);
});

// Authentication route (for testing)
Route::post('/auth/login', function (Request $request) {
    return response()->json([
        'success' => true,
        'token' => 'test-token-12345',
        'user' => [
            'name' => 'Test User',
            'email' => 'test@example.com'
        ]
    ]);
});

// Public routes (no authentication needed for testing)
Route::prefix('financial-records')->group(function () {
    Route::get('/', [FinancialRecordController::class, 'index']);
    Route::post('/', [FinancialRecordController::class, 'store']);
    Route::delete('/delete-all', function () {
        try {
            $count = \App\Models\FinancialRecord::count();

            \App\Models\FinancialRecord::query()->delete();

            return response()->json([
                'success' => true,
                'message' => "Deleted {$count} records successfully"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    });
    Route::get('/{id}', [FinancialRecordController::class, 'show']);
    Route::put('/{id}', [FinancialRecordController::class, 'update']);
    Route::delete('/{id}', [FinancialRecordController::class, 'destroy']);
    Route::get('/{id}/history', [FinancialRecordController::class, 'recordHistory']);
});

// Financial Summary
Route::get('/financial-summary', [FinancialRecordController::class, 'summary']);

// Excel Operations
Route::prefix('excel')->group(function () {
    Route::post('/upload', [ExcelController::class, 'upload']);
    Route::post('/validate-and-clean', [ExcelController::class, 'validateAndClean']);
    Route::get('/export', [ExcelController::class, 'export']);
    Route::get('/template', [ExcelController::class, 'template']);
    Route::post('/view', [ExcelController::class, 'viewExcel']);
    Route::get('/upload-history', [ExcelController::class, 'uploadHistory']);
    Route::get('/analyze-data', [ExcelController::class, 'analyzeData']);
    Route::post('/clean-data', [ExcelController::class, 'cleanData']);
    Route::get('/pivot', [ExcelController::class, 'pivot']);
});

Route::post('/test-upload', function (Request $request) {
    $file = $request->file('file');

    if (!$file) {
        return response()->json(['error' => 'No file received']);
    }

    try {
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        return response()->json([
            'total_rows' => count($rows),
            'first_10_rows' => array_slice($rows, 0, 10),
            'file_info' => [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType()
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

Route::delete('/financial-records/delete-all', function () {
    try {
        $count = \App\Models\FinancialRecord::count();
        \App\Models\FinancialRecord::query()->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted {$count} records successfully"
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], 500);
    }
});
