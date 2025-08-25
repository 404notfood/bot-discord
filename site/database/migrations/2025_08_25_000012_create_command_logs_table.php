<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('command_logs', function (Blueprint $table) {
            $table->id();
            $table->string('command_name', 100);
            $table->string('user_id', 50)->comment('Discord User ID');
            $table->string('guild_id', 50)->nullable()->comment('Discord Guild ID');
            $table->string('channel_id', 50)->comment('Discord Channel ID');
            $table->json('options')->nullable();
            $table->boolean('success')->default(true);
            $table->text('error_message')->nullable();
            $table->integer('execution_time')->nullable()->comment('Temps d\'exécution en ms');
            $table->timestamp('created_at')->useCurrent();
            
            $table->index('command_name');
            $table->index('user_id');
            $table->index('guild_id');
            $table->index('created_at');
            $table->index('success');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('command_logs');
    }
};