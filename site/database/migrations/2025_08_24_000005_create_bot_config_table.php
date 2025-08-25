<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_config', function (Blueprint $table) {
            $table->id();
            $table->string('config_key', 50)->comment('Clé de configuration');
            $table->text('config_value')->comment('Valeur de configuration');
            $table->text('description')->nullable()->comment('Description de la configuration');
            $table->string('guild_id', 30)->nullable()->comment('ID du serveur (NULL pour global)');
            $table->timestamps();
            
            $table->index('config_key');
            $table->index('guild_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_config');
    }
};