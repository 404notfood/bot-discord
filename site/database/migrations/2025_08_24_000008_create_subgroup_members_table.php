<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subgroup_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subgroup_id')->constrained('subgroups')->onDelete('cascade');
            $table->string('user_id', 50);
            $table->string('role', 50)->default('member');
            $table->timestamp('joined_at')->useCurrent();
            
            $table->unique(['subgroup_id', 'user_id'], 'unique_subgroup_member');
            $table->index('subgroup_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subgroup_members');
    }
};