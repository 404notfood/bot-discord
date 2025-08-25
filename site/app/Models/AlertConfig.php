<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlertConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'guild_id',
        'type',
        'channel_id',
        'is_enabled',
        'config'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'config' => 'array'
    ];

    /**
     * Scope pour les configurations activées
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope pour un serveur spécifique
     */
    public function scopeForGuild($query, $guildId)
    {
        return $query->where('guild_id', $guildId);
    }

    /**
     * Scope pour un type d'alerte spécifique
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
