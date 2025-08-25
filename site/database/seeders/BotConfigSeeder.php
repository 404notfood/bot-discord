<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BotConfig;

class BotConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            ['config_key' => 'bot.prefix', 'config_value' => '!', 'description' => 'Préfixe des commandes textuelles'],
            ['config_key' => 'bot.language', 'config_value' => 'fr', 'description' => 'Langue du bot'],
            ['config_key' => 'bot.timezone', 'config_value' => 'Europe/Paris', 'description' => 'Fuseau horaire du bot'],
            ['config_key' => 'welcome_message', 'config_value' => 'Bienvenue {user} sur le serveur Taureau Celtique !', 'description' => 'Message de bienvenue pour les nouveaux membres'],
            ['config_key' => 'moderation.auto_mod', 'config_value' => 'true', 'description' => 'Modération automatique activée'],
            ['config_key' => 'moderation.warn_threshold', 'config_value' => '3', 'description' => 'Nombre d\'avertissements avant action'],
            ['config_key' => 'moderation.auto_ban_duration', 'config_value' => '7', 'description' => 'Durée de bannissement automatique en jours'],
            ['config_key' => 'projects.max_per_user', 'config_value' => '2', 'description' => 'Nombre max de projets par utilisateur'],
            ['config_key' => 'projects.auto_archive_days', 'config_value' => '30', 'description' => 'Archivage automatique après X jours d\'inactivité'],
            ['config_key' => 'studi.enabled', 'config_value' => 'false', 'description' => 'Système anti-Studi activé'],
            ['config_key' => 'studi.max_offenses', 'config_value' => '3', 'description' => 'Nombre max d\'infractions Studi'],
            ['config_key' => 'docs.cache_ttl', 'config_value' => '3600', 'description' => 'TTL du cache documentation (secondes)'],
            ['config_key' => 'api.rate_limit', 'config_value' => '100', 'description' => 'Limite de requêtes par minute'],
            ['config_key' => 'log_channel_id', 'config_value' => '', 'description' => 'ID du canal pour les logs de modération'],
        ];

        foreach ($configs as $config) {
            BotConfig::updateOrCreate(
                ['config_key' => $config['config_key']],
                $config
            );
        }
    }
}