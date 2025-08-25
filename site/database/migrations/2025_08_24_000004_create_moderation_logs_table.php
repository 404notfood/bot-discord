<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moderation_logs', function (Blueprint $table) {
            $table->id();
            $table->string('guild_id', 50);
            $table->enum('action_type', ['warn', 'kick', 'ban', 'unban', 'mute', 'unmute']);
            $table->string('user_id', 50);
            $table->string('moderator_id', 50);
            $table->text('reason')->nullable();
            $table->json('additional_info')->nullable();
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('guild_id');
            $table->index('user_id');
            $table->index('moderator_id');
            $table->index('action_type');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_logs');
    }
};