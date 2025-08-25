<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alert_configs', function (Blueprint $table) {
            $table->id();
            $table->string('guild_id', 50);
            $table->string('type', 50)->comment('Type d\'alerte');
            $table->string('channel_id', 50)->comment('Canal de destination Discord');
            $table->boolean('is_enabled')->default(true);
            $table->json('config')->nullable()->comment('Configuration spécifique');
            $table->timestamps();
            
            $table->index('guild_id');
            $table->index('type');
            $table->index('is_enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_configs');
    }
};