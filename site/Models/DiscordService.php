<?php
namespace Models;

use Core\Model;

/**
 * Service pour interagir avec l'API Discord
 */
class DiscordService extends Model
{
    private string $apiBaseUrl = 'https://discord.com/api/v10';
    private string $botApiUrl = 'https://bot.rtfm2win.ovh/api';
    private ?string $botToken;

    public function __construct()
    {
        parent::__construct();

        $configModel = new ConfigModel();
        $this->botToken = $configModel->getDiscordBotToken();

        if (empty($this->botToken)) {
            error_log('[DiscordService] Token du bot Discord non configuré.');
        }
    }

    /**
     * Crée une catégorie dans un serveur Discord
     */
    public function createCategory(string $guildId, string $name, array $options = []): array|false
    {
        $data = [
            'name' => $name,
            'type' => 4,
            'permission_overwrites' => $options['permission_overwrites'] ?? []
        ];

        return $this->sendRequest("guilds/{$guildId}/channels", 'POST', $data);
    }

    /**
     * Crée un canal textuel
     */
    public function createTextChannel(string $guildId, string $name, array $options = []): array|false
    {
        $data = [
            'name' => $name,
            'type' => 0,
            'parent_id' => $options['parent_id'] ?? null,
            'permission_overwrites' => $options['permission_overwrites'] ?? []
        ];

        return $this->sendRequest("guilds/{$guildId}/channels", 'POST', $data);
    }

    /**
     * Crée un canal vocal
     */
    public function createVoiceChannel(string $guildId, string $name, array $options = []): array|false
    {
        $data = [
            'name' => $name,
            'type' => 2,
            'parent_id' => $options['parent_id'] ?? null,
            'permission_overwrites' => $options['permission_overwrites'] ?? []
        ];

        return $this->sendRequest("guilds/{$guildId}/channels", 'POST', $data);
    }

    /**
     * Met à jour les permissions d'un canal
     */
    public function updateChannelPermissions(string $channelId, array $permissionOverwrites): array|false
    {
        $data = [
            'permission_overwrites' => $permissionOverwrites
        ];

        return $this->sendRequest("channels/{$channelId}", 'PATCH', $data);
    }

    /**
     * Ajoute des permissions à un utilisateur
     */
    public function addUserPermission(string $channelId, string $userId, int $allow = 0, int $deny = 0): array|false
    {
        $data = [
            'type' => 1,
            'id' => $userId,
            'allow' => (string)$allow,
            'deny' => (string)$deny
        ];

        return $this->sendRequest("channels/{$channelId}/permissions/{$userId}", 'PUT', $data);
    }

    /**
     * Envoie un message dans un canal
     */
    public function sendMessage(string $channelId, string $content, array $options = []): array|false
    {
        $data = ['content' => $content];

        if (!empty($options['embeds'])) {
            $data['embeds'] = $options['embeds'];
        }

        return $this->sendRequest("channels/{$channelId}/messages", 'POST', $data);
    }

    /**
     * Récupère tous les canaux d'un serveur
     */
    public function getGuildChannels(string $guildId): array|false
    {
        if (empty($this->botToken) || empty($guildId)) {
            error_log("[DiscordService] Token ou ID de guilde manquant");
            return $this->getFallbackChannels($guildId);
        }

        try {
            $channels = $this->sendBotRequest('get_guild_channels', ['guild_id' => $guildId]);

            if (is_array($channels) && !empty($channels)) {
                $this->cacheChannels($guildId, $channels);
                return $channels;
            }

            $channels = $this->sendRequest("guilds/{$guildId}/channels", 'GET');

            if (is_array($channels)) {
                $this->cacheChannels($guildId, $channels);
                return $channels;
            }

            return $this->getFallbackChannels($guildId);
        } catch (\Exception $e) {
            error_log("[DiscordService] Erreur lors de la récupération des canaux : " . $e->getMessage());
            return $this->getFallbackChannels($guildId);
        }
    }

    /**
     * Met en cache les canaux d'un serveur
     */
    private function cacheChannels(string $guildId, array $channels): bool
    {
        $cacheDir = dirname(__DIR__) . '/cache';

        if (!is_dir($cacheDir) && !mkdir($cacheDir, 0777, true)) {
            error_log("[DiscordService] Impossible de créer le répertoire de cache");
            return false;
        }

        $cacheFile = "{$cacheDir}/discord_channels_{$guildId}.json";

        return file_put_contents($cacheFile, json_encode([
            'timestamp' => time(),
            'channels' => $channels
        ])) !== false;
    }

    /**
     * Récupère les canaux depuis le cache ou retourne une liste par défaut
     */
    private function getFallbackChannels(string $guildId): array
    {
        $cacheFile = dirname(__DIR__) . "/cache/discord_channels_{$guildId}.json";

        if (file_exists($cacheFile)) {
            $cache = json_decode(file_get_contents($cacheFile), true);

            if ($cache && (time() - $cache['timestamp']) < 86400) {
                return $cache['channels'];
            }
        }

        $defaultChannels = [
            ['id' => '1280967980049498315', 'name' => 'Blablabla', 'type' => 0],
            ['id' => '1369916432447438899', 'name' => 'Test-bot', 'type' => 0],
            ['id' => '1369916433001234567', 'name' => 'questions', 'type' => 0],
            ['id' => '1369916433101234567', 'name' => 'off-topic', 'type' => 0],
            ['id' => '1369916433201234567', 'name' => 'ressources', 'type' => 0],
            ['id' => '1369916433301234567', 'name' => 'projets', 'type' => 0],
            ['id' => '1369916433401234567', 'name' => 'entraide', 'type' => 0],
            ['id' => '1369916433501234567', 'name' => 'bienvenue', 'type' => 0],
            ['id' => '1369916433601234567', 'name' => 'présentation', 'type' => 0],
            ['id' => '1369916433701234567', 'name' => 'actualités', 'type' => 0],
            ['id' => '1369916433801234567', 'name' => 'tutos', 'type' => 0],
            ['id' => '1369916433901234567', 'name' => 'événements', 'type' => 0],
            ['id' => '1369916434001234567', 'name' => 'discussions', 'type' => 0],
            ['id' => '1369916434101234567', 'name' => 'code', 'type' => 0],
            ['id' => '1369916434201234567', 'name' => 'design', 'type' => 0],
            ['id' => '1369916434301234567', 'name' => 'marketing', 'type' => 0],
            ['id' => '1369916434401234567', 'name' => 'développement', 'type' => 0],
            ['id' => '1369916434501234567', 'name' => 'backend', 'type' => 0],
            ['id' => '1369916434601234567', 'name' => 'frontend', 'type' => 0],
            ['id' => '1369916434701234567', 'name' => 'mobile', 'type' => 0]
        ];

        $this->cacheChannels($guildId, $defaultChannels);

        return $defaultChannels;
    }

    /**
     * Envoie une requête HTTP vers l'API Discord
     */
    private function sendRequest(string $endpoint, string $method = 'GET', array $data = null): array|false
    {
        $url = "{$this->apiBaseUrl}/{$endpoint}";

        $headers = [
            "Authorization: Bot {$this->botToken}",
            "Content-Type: application/json"
        ];

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers
        ];

        if (!is_null($data)) {
            $options[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        $ch = curl_init();
        curl_setopt_array($ch, $options);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            error_log("[DiscordService] cURL error: " . curl_error($ch));
            curl_close($ch);
            return false;
        }

        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300) {
            return json_decode($response, true);
        }

        error_log("[DiscordService] HTTP $httpCode: $response");
        return false;
    }

    /**
     * Appelle une méthode sur l'API intermédiaire du bot local
     */
    private function sendBotRequest(string $action, array $payload): array|false
    {
        $url = "{$this->botApiUrl}/{$action}";

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                "Content-Type: application/json",
                "Authorization: Bearer {$this->botToken}"
            ],
            CURLOPT_POSTFIELDS => json_encode($payload)
        ]);

        $response = curl_exec($ch);

        if (curl_errno($ch)) {
            error_log("[DiscordService] Erreur Bot API : " . curl_error($ch));
            curl_close($ch);
            return false;
        }

        curl_close($ch);
        return json_decode($response, true);
    }
}
