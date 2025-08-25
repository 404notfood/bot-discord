<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doc_resources', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->text('url');
            $table->string('language', 100);
            $table->foreignId('category_id')->nullable()->constrained('doc_categories')->onDelete('set null');
            $table->text('tags')->nullable();
            $table->text('search_url')->nullable();
            $table->text('tutorial_url')->nullable();
            $table->integer('popularity')->default(0);
            $table->boolean('is_active')->default(true);
            $table->string('added_by', 50)->nullable();
            $table->timestamps();
            
            $table->unique('url', 'unique_resource_url');
            $table->index('category_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_resources');
    }
};