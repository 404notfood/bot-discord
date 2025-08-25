<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ModerationLog extends Model
{
    use HasFactory;

    protected $table = 'moderation_logs';
    
    protected $fillable = [
        'guild_id',
        'action_type',
        'user_id',
        'moderator_id',
        'reason',
        'additional_info'
    ];

    protected $casts = [
        'additional_info' => 'json',
        'created_at' => 'datetime'
    ];

    public $timestamps = true;
    
    // Laravel utilise created_at et updated_at par défaut
    // Mais notre table n'a que created_at
    const UPDATED_AT = null;

    /**
     * Relation avec le modérateur
     */
    public function moderator(): BelongsTo
    {
        return $this->belongsTo(BotAdmin::class, 'moderator_id', 'user_id');
    }

    /**
     * Relation avec l'utilisateur ciblé (si c'est un membre du dashboard)
     */
    public function targetMember(): BelongsTo
    {
        return $this->belongsTo(DashboardMember::class, 'user_id', 'id');
    }

    /**
     * Obtenir le type d'action formaté
     */
    public function getFormattedActionTypeAttribute(): string
    {
        return match($this->action_type) {
            'ban' => 'Bannissement',
            'kick' => 'Expulsion',
            'mute' => 'Mise en sourdine',
            'warn' => 'Avertissement',
            'timeout' => 'Timeout',
            'unban' => 'Débannissement',
            'unmute' => 'Fin de sourdine',
            default => ucfirst($this->action_type)
        };
    }

    /**
     * Obtenir la durée formatée
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!$this->duration) {
            return null;
        }

        $minutes = $this->duration;
        
        if ($minutes < 60) {
            return "{$minutes} minute(s)";
        }
        
        $hours = floor($minutes / 60);
        $remainingMinutes = $minutes % 60;
        
        if ($hours < 24) {
            return $remainingMinutes > 0 ? 
                "{$hours}h {$remainingMinutes}min" : 
                "{$hours}h";
        }
        
        $days = floor($hours / 24);
        $remainingHours = $hours % 24;
        
        return $remainingHours > 0 ? 
            "{$days}j {$remainingHours}h" : 
            "{$days}j";
    }

    /**
     * Vérifier si l'action est temporaire
     */
    public function getIsTemporaryAttribute(): bool
    {
        return !is_null($this->duration) && $this->duration > 0;
    }

    /**
     * Scope pour les actions d'un type spécifique
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('action_type', $type);
    }

    /**
     * Scope pour les actions d'un modérateur spécifique
     */
    public function scopeByModerator($query, string $moderatorId)
    {
        return $query->where('moderator_id', $moderatorId);
    }

    /**
     * Scope pour les actions récentes
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Scope pour les actions sur un utilisateur spécifique
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }
}
