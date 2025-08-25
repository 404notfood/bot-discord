<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BotConfig;

class BotConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            [
                'config_key' => 'bot_prefix',
                'config_value' => '!',
                'description' => 'Préfixe par défaut pour les commandes du bot',
            ],
            [
                'config_key' => 'welcome_message',
                'config_value' => 'Bienvenue {user} sur le serveur Taureau Celtique !',
                'description' => 'Message de bienvenue pour les nouveaux membres',
            ],
            [
                'config_key' => 'moderation_enabled',
                'config_value' => 'true',
                'description' => 'Activer la modération automatique',
            ],
            [
                'config_key' => 'max_warnings',
                'config_value' => '3',
                'description' => 'Nombre maximum d\'avertissements avant action',
            ],
            [
                'config_key' => 'auto_ban_duration',
                'config_value' => '7',
                'description' => 'Durée de bannissement automatique en jours',
            ],
            [
                'config_key' => 'log_channel_id',
                'config_value' => '',
                'description' => 'ID du canal pour les logs de modération',
            ],
        ];

        foreach ($configs as $config) {
            BotConfig::updateOrCreate(
                ['config_key' => $config['config_key']],
                $config
            );
        }
    }
}