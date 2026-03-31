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
                            'error' => "Invalid category: '{$row[1]}'. Must be text, not a number"
                        ];
                        continue;
                    }

                    $amount = floatval($row[2] ?? 0);
                    if ($amount <= 0) {
                        $skipped++;
                        $errors[] = [
                            'row' => $index + 2,
                            'error' => "Invalid amount: '{$row[2]}'. Must be positive number"
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
            $records = FinancialRecord::all();

            $issues = [
                'duplicates' => ['count' => 0, 'groups' => []],
                'missing_descriptions' => ['count' => 0, 'records' => []],
                'outliers' => ['count' => 0, 'records' => []],
                'unusual_dates' => ['count' => 0, 'records' => []]
            ];

            $grouped = $records->groupBy(function($item) {
                return $item->type . '|' . $item->category . '|' . $item->amount . '|' . $item->date;
            });

            foreach ($grouped as $key => $group) {
                if ($group->count() > 1) {
                    $firstRecord = $group->first();
                    $issues['duplicates']['groups'][] = [
                        'count' => $group->count(),
                        'sample' => [
                            'type' => $firstRecord->type,
                            'category' => $firstRecord->category,
                            'amount' => (float)$firstRecord->amount,
                            'date' => $firstRecord->date
                        ],
                        'records' => $group->map(function($r) {
                            return [
                                'id' => $r->id,
                                'type' => $r->type,
                                'category' => $r->category,
                                'amount' => (float)$r->amount,
                                'date' => $r->date
                            ];
                        })->values()->all()
                    ];
                }
            }
            $issues['duplicates']['count'] = count($issues['duplicates']['groups']);

            foreach ($records as $record) {
                if (empty($record->description) || $record->description === $record->category) {
                    $issues['missing_descriptions']['records'][] = [
                        'id' => $record->id,
                        'type' => $record->type,
                        'category' => $record->category,
                        'amount' => (float)$record->amount,
                        'date' => $record->date
                    ];
                }
            }
            $issues['missing_descriptions']['count'] = count($issues['missing_descriptions']['records']);

            if ($records->count() > 3) {
                $amounts = $records->pluck('amount')->toArray();
                $mean = array_sum($amounts) / count($amounts);
                $variance = array_sum(array_map(function($x) use ($mean) {
                    return pow($x - $mean, 2);
                }, $amounts)) / count($amounts);
                $stdDev = sqrt($variance);

                if ($stdDev > 0) {
                    foreach ($records as $record) {
                        if (abs($record->amount - $mean) > (3 * $stdDev)) {
                            $issues['outliers']['records'][] = [
                                'id' => $record->id,
                                'type' => $record->type,
                                'category' => $record->category,
                                'amount' => (float)$record->amount,
                                'date' => $record->date
                            ];
                        }
                    }
                }
                $issues['outliers']['count'] = count($issues['outliers']['records']);
            }

            $today = date('Y-m-d');
            $oldDate = date('Y-m-d', strtotime('-10 years'));

            foreach ($records as $record) {
                if ($record->date > $today || $record->date < $oldDate) {
                    $issues['unusual_dates']['records'][] = [
                        'id' => $record->id,
                        'type' => $record->type,
                        'category' => $record->category,
                        'amount' => (float)$record->amount,
                        'date' => $record->date,
                        'issue' => $record->date > $today ? 'Future date' : 'Very old date (>10 years)'
                    ];
                }
            }
            $issues['unusual_dates']['count'] = count($issues['unusual_dates']['records']);

            return response()->json([
                'success' => true,
                'data' => [
                    'total_records' => $records->count(),
                    'issues' => $issues
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function cleanData(Request $request)
    {
        try {
            $action = $request->input('action');
            $recordIds = $request->input('record_ids', []);

            if (empty($recordIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No record IDs provided'
                ], 400);
            }

            $cleaned = 0;

            switch ($action) {
                case 'remove_duplicates':
                    if (count($recordIds) > 1) {
                        $keepId = $recordIds[0];
                        $deleteIds = array_slice($recordIds, 1);
                        FinancialRecord::whereIn('id', $deleteIds)->delete();
                        $cleaned = count($deleteIds);
                    }
                    break;

                case 'fill_descriptions':
                    foreach ($recordIds as $id) {
                        $record = FinancialRecord::find($id);
                        if ($record) {
                            $record->description = ucfirst($record->type) . ' - ' . $record->category;
                            $record->save();
                            $cleaned++;
                        }
                    }
                    break;

                case 'delete_records':
                    FinancialRecord::whereIn('id', $recordIds)->delete();
                    $cleaned = count($recordIds);
                    break;

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Unknown action: ' . $action
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
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    public function pivot(Request $request)
    {
        try {
            $groupBy = $request->input('group_by', 'category');
            $aggregate = $request->input('aggregate', 'sum');

            $records = FinancialRecord::all();

            if ($records->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'rows' => [],
                        'summary' => [
                            'total_records' => 0,
                            'total_groups' => 0
                        ]
                    ]
                ]);
            }

            $grouped = $records->groupBy(function($record) use ($groupBy) {
                switch ($groupBy) {
                    case 'type': return $record->type;
                    case 'category': return $record->category;
                    case 'year': return date('Y', strtotime($record->date));
                    case 'month': return date('Y-m', strtotime($record->date));
                    case 'quarter':
                        $year = date('Y', strtotime($record->date));
                        $quarter = ceil(date('n', strtotime($record->date)) / 3);
                        return "{$year}-Q{$quarter}";
                    default: return $record->category;
                }
            });

            $results = [];
            foreach ($grouped as $key => $group) {
                $amounts = $group->pluck('amount')->map(function($v) {
                    return (float)$v;
                });

                $value = 0;
                switch ($aggregate) {
                    case 'sum': $value = $amounts->sum(); break;
                    case 'avg': $value = $amounts->avg(); break;
                    case 'count': $value = $amounts->count(); break;
                    case 'min': $value = $amounts->min(); break;
                    case 'max': $value = $amounts->max(); break;
                }

                $results[] = [
                    'label' => (string)$key,
                    'value' => round($value, 2),
                    'count' => $group->count()
                ];
            }

            usort($results, function($a, $b) {
                return $b['value'] <=> $a['value'];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'rows' => $results,
                    'summary' => [
                        'total_records' => $records->count(),
                        'total_groups' => count($results),
                        'group_by' => $groupBy,
                        'aggregate' => $aggregate
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
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
