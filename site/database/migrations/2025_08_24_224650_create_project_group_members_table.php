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
        Schema::create('project_group_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('main_projects')->onDelete('cascade');
            $table->foreignId('member_id')->constrained('dashboard_members')->onDelete('cascade');
            $table->enum('role', ['owner', 'admin', 'member', 'viewer'])->default('member');
            $table->timestamp('joined_at')->useCurrent();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Empêcher les doublons
            $table->unique(['project_id', 'member_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_group_members');
    }
};
