<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudiConfig extends Model
{
    protected $table = 'studi_config';
    
    protected $fillable = [
        'is_enabled',
        'max_offenses',
        'ban_duration_hours',
        'whitelist_enabled'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'max_offenses' => 'integer',
        'ban_duration_hours' => 'integer',
        'whitelist_enabled' => 'boolean',
    ];
}