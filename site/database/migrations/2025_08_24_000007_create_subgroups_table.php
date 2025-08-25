<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subgroups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->string('leader_id', 50)->nullable();
            $table->timestamps();
            
            $table->index('project_id');
            $table->index('leader_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subgroups');
    }
};