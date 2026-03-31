<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('financial_records', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['revenue', 'expenditure']);
            $table->string('category');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->date('date');
            $table->string('source')->default('manual'); // manual, excel, api
            $table->string('original_file')->nullable(); // original Excel filename
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes for better query performance
            $table->index('type');
            $table->index('date');
            $table->index(['type', 'date']);
            $table->index('source');
        });

        // Table for tracking history/changes
        Schema::create('financial_record_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financial_record_id')->constrained()->onDelete('cascade');
            $table->string('action'); // created, updated, deleted, cleaned
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->text('change_description')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            
            $table->index('financial_record_id');
            $table->index('action');
            $table->index('created_at');
        });

        // Table for storing uploaded Excel files
        Schema::create('excel_uploads', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('original_filename');
            $table->string('file_path');
            $table->integer('total_rows')->default(0);
            $table->integer('imported_rows')->default(0);
            $table->integer('failed_rows')->default(0);
            $table->json('validation_errors')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();
            
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_record_history');
        Schema::dropIfExists('excel_uploads');
        Schema::dropIfExists('financial_records');
    }
};
