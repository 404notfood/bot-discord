<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudiBannedUser extends Model
{
    protected $table = 'studi_offenders';
    
    protected $fillable = [
        'user_id',
        'guild_id',
        'offense_count',
        'last_offense',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'offense_count' => 'integer',
        'last_offense' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}