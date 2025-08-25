<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommandLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'command_name',
        'user_id',
        'guild_id',
        'channel_id',
        'options',
        'success',
        'error_message',
        'execution_time'
    ];

    protected $casts = [
        'options' => 'array',
        'success' => 'boolean',
        'execution_time' => 'integer',
        'created_at' => 'datetime'
    ];

    /**
     * Scope pour les commandes réussies
     */
    public function scopeSuccessful($query)
    {
        return $query->where('success', true);
    }

    /**
     * Scope pour les commandes échouées
     */
    public function scopeFailed($query)
    {
        return $query->where('success', false);
    }

    /**
     * Scope pour les commandes récentes
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
