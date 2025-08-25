<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configuration anti-Studi
        Schema::create('studi_config', function (Blueprint $table) {
            $table->id();
            $table->boolean('is_enabled')->default(false);
            $table->integer('max_offenses')->default(3);
            $table->integer('ban_duration_hours')->default(24);
            $table->boolean('whitelist_enabled')->default(true);
            $table->timestamps();
        });

        // Utilisateurs bannis du système Studi
        Schema::create('studi_banned_users', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique()->comment('Discord User ID');
            $table->string('username', 100);
            $table->text('reason')->nullable();
            $table->string('banned_by', 50)->comment('Discord User ID du modérateur');
            $table->timestamp('banned_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->index('banned_by');
            $table->index('is_active');
        });

        // Infractions Studi
        Schema::create('studi_offenses', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50);
            $table->string('guild_id', 50);
            $table->integer('offense_count')->default(1);
            $table->timestamp('last_offense')->useCurrent();
            $table->timestamp('created_at')->useCurrent();
            
            $table->unique(['user_id', 'guild_id']);
            $table->index('user_id');
            $table->index('guild_id');
        });

        // Liste blanche Studi
        Schema::create('studi_whitelist', function (Blueprint $table) {
            $table->id();
            $table->string('user_id', 50)->unique()->comment('Discord User ID');
            $table->string('username', 100);
            $table->string('added_by', 50)->comment('Discord User ID du modérateur');
            $table->text('reason')->nullable();
            $table->timestamp('added_at')->useCurrent();
            
            $table->index('added_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('studi_whitelist');
        Schema::dropIfExists('studi_offenses');
        Schema::dropIfExists('studi_banned_users');
        Schema::dropIfExists('studi_config');
    }
};