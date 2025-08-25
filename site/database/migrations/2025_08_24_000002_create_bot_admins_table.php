<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_admins', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique('unique_admin');
            $table->string('username', 100);
            $table->string('added_by', 50);
            $table->timestamp('added_at')->useCurrent();
            
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_admins');
    }
};