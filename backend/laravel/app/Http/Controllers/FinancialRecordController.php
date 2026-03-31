<?php

namespace App\Http\Controllers;

use App\Models\FinancialRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FinancialRecordController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = FinancialRecord::query();

            // Filter type
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }

            // Filter tanggal
            if ($request->has('start_date') && $request->start_date) {
                $query->where('date', '>=', $request->start_date);
            }
            if ($request->has('end_date') && $request->end_date) {
                $query->where('date', '<=', $request->end_date);
            }

            // Paginasi
            $perPage = $request->get('per_page', 50);
            $records = $query->orderBy('date', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $records->items(),
                'meta' => [
                    'current_page' => $records->currentPage(),
                    'per_page' => $records->perPage(),
                    'total' => $records->total(),
                    'last_page' => $records->lastPage()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching records: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Membuat financial record
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:revenue,expenditure',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'date' => 'required|date'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $record = FinancialRecord::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Record created successfully',
                'data' => $record
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating record: ' . $e->getMessage()
            ], 500);
        }
    }
    public function show($id)
    {
        try {
            $record = FinancialRecord::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $record
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found'
            ], 404);
        }
    }

    /**
     * Mengupdate record
     */
    public function update(Request $request, $id)
    {
        try {
            $record = FinancialRecord::findOrFail($id);
            $record->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Record updated successfully',
                'data' => $record
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Menghapus record
     */
    public function destroy($id)
    {
        try {
            $record = FinancialRecord::findOrFail($id);
            $record->delete();

            return response()->json([
                'success' => true,
                'message' => 'Record deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting record: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Summary untuk financial record
     */
    public function summary(Request $request)
    {
        try {
            $revenue = FinancialRecord::where('type', 'revenue')->sum('amount');
            $expenditure = FinancialRecord::where('type', 'expenditure')->sum('amount');
            $netProfit = $revenue - $expenditure;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_revenue' => (float) $revenue,
                    'total_expenditure' => (float) $expenditure,
                    'net_profit' => (float) $netProfit
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error calculating summary: ' . $e->getMessage()
            ], 500);
        }
    }

    public function recordHistory($id)
    {
        try {
            $record = FinancialRecord::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'record' => $record,
                    'history' => [] // No history tracking in simple version
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Record not found'
            ], 404);
        }
    }
}
