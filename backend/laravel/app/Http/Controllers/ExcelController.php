<?php

namespace App\Http\Controllers;

use App\Models\FinancialRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExcelController extends Controller
{
    public function template()
    {
        try {
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            $sheet->setCellValue('A1', 'Type');
            $sheet->setCellValue('B1', 'Category');
            $sheet->setCellValue('C1', 'Amount');
            $sheet->setCellValue('D1', 'Description');
            $sheet->setCellValue('E1', 'Date');

            $sheet->setCellValue('A2', 'revenue');
            $sheet->setCellValue('B2', 'Sales');
            $sheet->setCellValue('C2', '1000');
            $sheet->setCellValue('D2', 'Product sales');
            $sheet->setCellValue('E2', '2024-01-15');

            $sheet->setCellValue('A3', 'expenditure');
            $sheet->setCellValue('B3', 'Office');
            $sheet->setCellValue('C3', '500');
            $sheet->setCellValue('D3', 'Office supplies');
            $sheet->setCellValue('E3', '2024-01-16');

            $fileName = 'financial_template.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), $fileName);
            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);

            return response()->download($tempFile, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response($e->getMessage(), 500);
        }
    }

    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();

            $highestRow = $worksheet->getHighestDataRow();

            if ($highestRow > 10000) {
                return response()->json([
                    'success' => false,
                    'message' => "File has too many rows ({$highestRow}). Maximum allowed is 10,000 rows."
                ], 422);
            }

            $rows = [];
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = [
                    $worksheet->getCell("A{$row}")->getValue(),
                    $worksheet->getCell("B{$row}")->getValue(),
                    $worksheet->getCell("C{$row}")->getValue(),
                    $worksheet->getCell("D{$row}")->getValue(),
                    $worksheet->getCell("E{$row}")->getValue(),
                ];

                if (empty(array_filter($rowData))) {
                    continue;
                }

                $rows[] = $rowData;
            }

            $imported = 0;
            $skipped = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                try {
                    $type = strtolower(trim($row[0] ?? ''));
                    if (!in_array($type, ['revenue', 'expenditure'])) {
                        $skipped++;
                        $errors[] = [
                            'row' => $index + 2,
                            'error' => "Invalid type: '{$row[0]}'. Must be 'revenue' or 'expenditure'"
                        ];
                        continue;
                    }

                    $category = trim($row[1] ?? '');
                    if (empty($category) || is_numeric($category)) {
                        $skipped++;
                        $errors[] = [
                            'row' => $index + 2,
                            'error' => "Invalid category: '{$row[1]}'. Harus teks"
                        ];
                        continue;
                    }

                    $amount = floatval($row[2] ?? 0);
                    if ($amount <= 0) {
                        $skipped++;
                        $errors[] = [
                            'row' => $index + 2,
                            'error' => "Invalid amount: '{$row[2]}'. Harus angka positif"
                        ];
                        continue;
                    }

                    $description = trim($row[3] ?? '');
                    if (empty($description)) {
                        $description = $category;
                    }

                    $dateValue = $row[4] ?? null;
                    $formattedDate = null;

                    if (empty($dateValue)) {
                        $formattedDate = date('Y-m-d');
                    } elseif (is_numeric($dateValue)) {
                        try {
                            $dateObj = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateValue);
                            $year = (int)$dateObj->format('Y');

                            if ($year < 1900 || $year > 2100) {
                                $skipped++;
                                $errors[] = [
                                    'row' => $index + 2,
                                    'error' => "Invalid date: year {$year} is out of range"
                                ];
                                continue;
                            }

                            $formattedDate = $dateObj->format('Y-m-d');
                        } catch (\Exception $e) {
                            $skipped++;
                            $errors[] = [
                                'row' => $index + 2,
                                'error' => "Invalid date format"
                            ];
                            continue;
                        }
                    } else {
                        try {
                            $timestamp = strtotime($dateValue);
                            if ($timestamp === false) {
                                throw new \Exception("Cannot parse date");
                            }
                            $formattedDate = date('Y-m-d', $timestamp);
                        } catch (\Exception $e) {
                            $skipped++;
                            $errors[] = [
                                'row' => $index + 2,
                                'error' => "Invalid date: '{$dateValue}'"
                            ];
                            continue;
                        }
                    }

                    FinancialRecord::create([
                        'type' => $type,
                        'category' => $category,
                        'amount' => $amount,
                        'description' => $description,
                        'date' => $formattedDate,
                        'source' => 'excel',
                    ]);
                    $imported++;

                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $index + 2,
                        'error' => $e->getMessage()
                    ];
                    $skipped++;
                }
            }

            $success = $imported > 0;
            $message = '';

            if ($imported > 0 && $skipped == 0) {
                $message = "✅ Successfully imported {$imported} records";
            } elseif ($imported > 0 && $skipped > 0) {
                $message = "⚠️ Imported {$imported} records, skipped {$skipped} invalid rows";
            } else {
                $message = "❌ No records imported. All {$skipped} rows had errors.";
                $success = false;
            }

            return response()->json([
                'success' => $success,
                'message' => $message,
                'data' => [
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'total_rows' => count($rows),
                    'errors' => array_slice($errors, 0, 10)
                ]
            ], $success ? 200 : 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error processing file: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            $records = FinancialRecord::all();

            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            $sheet->setCellValue('A1', 'Type');
            $sheet->setCellValue('B1', 'Category');
            $sheet->setCellValue('C1', 'Amount');
            $sheet->setCellValue('D1', 'Description');
            $sheet->setCellValue('E1', 'Date');

            $row = 2;
            foreach ($records as $record) {
                $sheet->setCellValue('A' . $row, $record->type);
                $sheet->setCellValue('B' . $row, $record->category);
                $sheet->setCellValue('C' . $row, $record->amount);
                $sheet->setCellValue('D' . $row, $record->description);
                $sheet->setCellValue('E' . $row, $record->date);
                $row++;
            }

            $fileName = 'financial_records_' . date('Y-m-d') . '.xlsx';
            $tempFile = tempnam(sys_get_temp_dir(), $fileName);
            $writer = new Xlsx($spreadsheet);
            $writer->save($tempFile);

            return response()->download($tempFile, $fileName, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            return response($e->getMessage(), 500);
        }
    }

    public function viewExcel(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getPathname());

            $sheets = [];

            foreach ($spreadsheet->getAllSheets() as $worksheet) {
                $allData = $worksheet->toArray(null, true, true, true);

                if (empty($allData)) {
                    continue;
                }

                $firstRow = reset($allData);
                $headers = array_values($firstRow);

                array_shift($allData);

                $formattedData = [];
                $rowNumber = 2;

                foreach ($allData as $row) {
                    if (empty(array_filter($row))) {
                        $rowNumber++;
                        continue;
                    }

                    $formattedRow = [];
                    $colIndex = 0;

                    foreach ($row as $cell) {
                        $header = $headers[$colIndex] ?? "Column_" . ($colIndex + 1);
                        $formattedRow[$header] = $cell ?? '';
                        $colIndex++;
                    }

                    $formattedRow['_row_number'] = $rowNumber;
                    $formattedData[] = $formattedRow;
                    $rowNumber++;
                }

                $sheets[] = [
                    'name' => $worksheet->getTitle(),
                    'headers' => $headers,
                    'rows' => $formattedData,
                    'total_rows' => count($formattedData),
                    'total_columns' => count($headers)
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'filename' => $file->getClientOriginalName(),
                    'sheets' => $sheets
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error reading Excel file: ' . $e->getMessage()
            ], 500);
        }
    }

    public function analyzeData(Request $request)
{
    try {
        $totalRecords = FinancialRecord::count();

        // === DUPLICATES ===
        $duplicatesQuery = FinancialRecord::select('type', 'category', 'amount', 'date')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('type', 'category', 'amount', 'date')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        $duplicateGroups = [];

        foreach ($duplicatesQuery as $dup) {
            $records = FinancialRecord::where([
                ['type', $dup->type],
                ['category', $dup->category],
                ['amount', $dup->amount],
                ['date', $dup->date],
            ])->get();

            $duplicateGroups[] = [
                'count' => $records->count(),
                'ids' => $records->pluck('id')->values()->all(),
                'sample' => [
                    'type' => $dup->type,
                    'category' => $dup->category,
                    'amount' => (float) $dup->amount,
                    'date' => $dup->date,
                ],
                'records' => $records->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'type' => $r->type,
                        'category' => $r->category,
                        'amount' => (float) $r->amount,
                        'date' => $r->date,
                    ];
                })->values()->all()
            ];
        }

        // MISSING DESCRIPTION
        // mengecek null, empty string, yang isinya hanya whitespace
        $missingDescriptions = FinancialRecord::where(function($query) {
            $query->whereNull('description')
                  ->orWhere('description', '')
                  ->orWhereRaw('TRIM(description) = ""')
                  ->orWhereRaw('description = category');
        })->get();

        // OUTLIER (nilai data yang menyimpang jauh dari nilai rata-rata / luar batas 3 simpangan baku)
        $outlierRecords = [];
        if ($totalRecords > 3) {
            $amounts = FinancialRecord::pluck('amount')->toArray();
            $mean = array_sum($amounts) / count($amounts);
            $variance = array_sum(array_map(function($x) use ($mean) {
                return pow($x - $mean, 2);
            }, $amounts)) / count($amounts);
            $stdDev = sqrt($variance);

            if ($stdDev > 0) {
                $outlierRecords = FinancialRecord::get()->filter(function($record) use ($mean, $stdDev) {
                    return abs($record->amount - $mean) > (3 * $stdDev);
                })->map(function($r) use ($mean, $stdDev) {
                    return [
                        'id' => $r->id,
                        'type' => $r->type,
                        'category' => $r->category,
                        'amount' => (float) $r->amount,
                        'date' => $r->date,
                        'deviation' => round(abs($r->amount - $mean) / $stdDev, 2) . ' σ'
                    ];
                })->values()->all();
            }
        }

        // UNUSUAL DATES (Tahun yang terlalu jauh ke depan (10 tahun ke atas) atau >= 10 tahun yang lalu)
        $today = date('Y-m-d');
        $oldDate = date('Y-m-d', strtotime('-10 years'));

        $unusualDates = FinancialRecord::where('date', '>', $today)
            ->orWhere('date', '<', $oldDate)
            ->get()
            ->map(function($r) use ($today) {
                return [
                    'id' => $r->id,
                    'type' => $r->type,
                    'category' => $r->category,
                    'amount' => (float) $r->amount,
                    'date' => $r->date,
                    'issue' => $r->date > $today ? 'Tanggal di masa depan' : 'Tanggal yang sudah lama terjadi (>10 tahun)'
                ];
            })->values()->all();

        return response()->json([
            'success' => true,
            'data' => [
                'total_records' => $totalRecords,
                'issues' => [
                    'duplicates' => [
                        'count' => count($duplicateGroups),
                        'groups' => $duplicateGroups,
                    ],
                    'missing_descriptions' => [
                        'count' => $missingDescriptions->count(),
                        'records' => $missingDescriptions->map(function($r) {
                            return [
                                'id' => $r->id,
                                'type' => $r->type,
                                'category' => $r->category,
                                'amount' => (float) $r->amount,
                                'date' => $r->date
                            ];
                        })->take(50)->values()->all(),
                    ],
                    'outliers' => [
                        'count' => count($outlierRecords),
                        'records' => $outlierRecords,
                    ],
                    'unusual_dates' => [
                        'count' => count($unusualDates),
                        'records' => $unusualDates,
                    ],
                ]
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Analyze error: ' . $e->getMessage()
        ], 500);
    }
}

    public function cleanData(Request $request)
{
    try {
        $action = $request->input('action');
        $recordIds = $request->input('record_ids', []);
        $cleaned = 0;

        switch ($action) {

            case 'remove_duplicates':
                if (!empty($recordIds)) {
                    if (count($recordIds) > 1) {
                        $deleteIds = array_slice($recordIds, 1);
                        FinancialRecord::whereIn('id', $deleteIds)->delete();
                        $cleaned = count($deleteIds);
                    }
                } else {
                    // GLOBAL duplicate cleaning
                    $duplicates = FinancialRecord::select('type', 'category', 'amount', 'date')
                        ->selectRaw('GROUP_CONCAT(id ORDER BY id) as ids, COUNT(*) as cnt')
                        ->groupBy('type', 'category', 'amount', 'date')
                        ->havingRaw('COUNT(*) > 1')
                        ->get();

                    foreach ($duplicates as $dup) {
                        $ids = array_map('intval', explode(',', $dup->ids));
                        array_shift($ids); // keep first
                        if (!empty($ids)) {
                            FinancialRecord::whereIn('id', $ids)->delete();
                            $cleaned += count($ids);
                        }
                    }
                }
                break;

            case 'fill_descriptions':
                if (empty($recordIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No record IDs provided'
                    ], 400);
                }

                foreach ($recordIds as $id) {
                    $record = FinancialRecord::find($id);
                    if ($record) {
                        $record->description =
                            ucfirst($record->type) . ' - ' . $record->category;
                        $record->save();
                        $cleaned++;
                    }
                }
                break;

            case 'delete_records':
                if (empty($recordIds)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No record IDs provided'
                    ], 400);
                }

                FinancialRecord::whereIn('id', $recordIds)->delete();
                $cleaned = count($recordIds);
                break;

            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Unknown action'
                ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => "Cleaned {$cleaned} records",
            'data' => [
                'cleaned_count' => $cleaned
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Cleaning error: ' . $e->getMessage()
        ], 500);
    }
}

    public function pivot(Request $request)
{
    try {
        $groupBy = $request->input('group_by', 'category');
        $aggregate = $request->input('aggregate', 'sum');

        $query = FinancialRecord::query();

        // FIELD MAPPING
        switch ($groupBy) {
            case 'type':
                $query->select('type as label');
                break;
            case 'category':
                $query->select('category as label');
                break;
            case 'year':
                $query->selectRaw('YEAR(date) as label');
                break;
            case 'month':
                $query->selectRaw('MONTH(date) as label');
                break;
            case 'quarter':
                $query->selectRaw('QUARTER(date) as label');
                break;
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid group_by'
                ], 400);
        }

        // AGGREGATION
        switch ($aggregate) {
            case 'sum':
                $query->selectRaw('SUM(amount) as value');
                break;
            case 'avg':
                $query->selectRaw('AVG(amount) as value');
                break;
            case 'count':
                $query->selectRaw('COUNT(*) as value');
                break;
            case 'min':
                $query->selectRaw('MIN(amount) as value');
                break;
            case 'max':
                $query->selectRaw('MAX(amount) as value');
                break;
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid aggregate'
                ], 400);
        }

        $query->selectRaw('COUNT(*) as count');
        $query->groupBy('label');

        $results = $query->get();

        return response()->json([
            'success' => true,
            'data' => [
                'rows' => $results->map(function ($row) {
                    return [
                        'label' => $row->label ?? 'Unknown',
                        'value' => (float) $row->value,
                        'count' => (int) $row->count,
                    ];
                }),
                'summary' => [
                    'total_groups' => $results->count(),
                    'total_records' => FinancialRecord::count(),
                ]
            ]
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Pivot error: ' . $e->getMessage()
        ], 500);
    }
}

    public function validateAndClean(Request $request) {
        return response()->json(['success' => true, 'data' => []]);
    }

    public function uploadHistory() {
        return response()->json(['success' => true, 'data' => []]);
    }
}
