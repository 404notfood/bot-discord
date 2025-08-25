<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BotConfig extends Model
{
    use HasFactory;

    protected $table = 'bot_config';
    
    protected $fillable = [
        'config_key',
        'config_value',
        'description'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public $timestamps = true;

    /**
     * Obtenir une valeur de configuration
     */
    public static function getValue(string $key, $default = null)
    {
        $config = static::where('config_key', $key)->first();
        return $config ? $config->config_value : $default;
    }

    /**
     * Définir une valeur de configuration
     */
    public static function setValue(string $key, string $value, string $description = null): self
    {
        return static::updateOrCreate(
            ['config_key' => $key],
            [
                'config_value' => $value,
                'description' => $description
            ]
        );
    }

    /**
     * Obtenir toutes les configurations par catégorie
     */
    public static function getByCategory(string $category): \Illuminate\Database\Eloquent\Collection
    {
        return static::where('config_key', 'like', $category . '%')->get();
    }

    /**
     * Vérifier si une configuration existe
     */
    public static function exists(string $key): bool
    {
        return static::where('config_key', $key)->exists();
    }

    /**
     * Supprimer une configuration
     */
    public static function remove(string $key): bool
    {
        return static::where('config_key', $key)->delete() > 0;
    }

    /**
     * Obtenir la valeur formatée selon le type
     */
    public function getFormattedValueAttribute()
    {
        $value = $this->config_value;
        
        // Détecter le type et formater
        if (in_array(strtolower($value), ['true', 'false', '1', '0'])) {
            return in_array(strtolower($value), ['true', '1']) ? 'Activé' : 'Désactivé';
        }
        
        if (is_numeric($value)) {
            return number_format((float)$value);
        }
        
        return $value;
    }

    /**
     * Scope pour les configurations actives
     */
    public function scopeEnabled($query)
    {
        return $query->whereIn('config_value', ['true', '1', 'enabled', 'on']);
    }

    /**
     * Scope pour rechercher par clé
     */
    public function scopeByKey($query, string $key)
    {
        return $query->where('config_key', $key);
    }
}