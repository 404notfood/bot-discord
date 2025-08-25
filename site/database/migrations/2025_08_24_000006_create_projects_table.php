<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('status', ['planning', 'in_progress', 'paused', 'completed', 'cancelled'])->default('planning');
            $table->string('owner_id', 50);
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamps();
            
            $table->index('status');
            $table->index('owner_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};