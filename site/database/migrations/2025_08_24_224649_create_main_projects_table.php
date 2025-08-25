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
        Schema::create('main_projects', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->enum('status', ['planning', 'in_progress', 'paused', 'completed', 'cancelled'])->default('planning');
            $table->string('owner_id', 50); // Discord user ID
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->integer('progress_percentage')->default(0);
            $table->integer('members_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('main_projects');
    }
};
