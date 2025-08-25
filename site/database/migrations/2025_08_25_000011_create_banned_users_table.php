<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banned_users', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->comment('Discord User ID');
            $table->string('username', 100);
            $table->text('reason')->nullable();
            $table->string('banned_by', 50)->comment('Discord User ID du modérateur');
            $table->integer('duration_days')->nullable()->comment('Durée en jours (NULL = permanent)');
            $table->timestamp('expires_at')->nullable()->comment('Date d\'expiration du ban');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('user_id');
            $table->index('banned_by');
            $table->index('is_active');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banned_users');
    }
};