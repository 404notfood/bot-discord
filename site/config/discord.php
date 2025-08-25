<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Discord Bot Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'intégration avec le bot Discord
    |
    */

    'bot_token' => env('DISCORD_BOT_TOKEN'),
    'application_id' => env('DISCORD_APPLICATION_ID'),
    'public_key' => env('DISCORD_PUBLIC_KEY'),
    'guild_id' => env('DISCORD_GUILD_ID'),

    /*
    |--------------------------------------------------------------------------
    | Database Configuration for Discord Bot
    |--------------------------------------------------------------------------
    |
    | Configuration de la base de données du bot Discord
    |
    */

    'database' => [
        'connection' => env('DISCORD_DB_CONNECTION', 'mysql'),
        'host' => env('DISCORD_DB_HOST', '127.0.0.1'),
        'port' => env('DISCORD_DB_PORT', '3306'),
        'database' => env('DISCORD_DB_DATABASE', 'discord_bot'),
        'username' => env('DISCORD_DB_USERNAME', 'root'),
        'password' => env('DISCORD_DB_PASSWORD', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour les API externes
    |
    */

    'webhook_url' => env('DISCORD_WEBHOOK_URL'),
    'api_secret' => env('API_SECRET_KEY'),

    /*
    |--------------------------------------------------------------------------
    | Rate Limiting
    |--------------------------------------------------------------------------
    |
    | Limite du taux de requêtes pour l'API Discord
    |
    */

    'rate_limit' => [
        'requests_per_minute' => 50,
        'burst_limit' => 5,
    ],
];