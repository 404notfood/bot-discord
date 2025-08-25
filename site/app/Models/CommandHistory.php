<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommandHistory extends Model
{
    use HasFactory;

    protected $table = 'command_history';
    
    protected $fillable = [
        'user_id',
        'username',
        'command',
        'args',
        'channel_id',
        'guild_id',
        'success',
        'error_message',
        'execution_time',
        'timestamp'
    ];

    protected $casts = [
        'args' => 'json',
        'success' => 'boolean',
        'execution_time' => 'float',
        'timestamp' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Relation avec l'admin qui a exécuté la commande
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(BotAdmin::class, 'user_id', 'user_id');
    }

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
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('timestamp', '>=', now()->subDays($days));
    }
}