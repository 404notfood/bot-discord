<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudiWhitelist extends Model
{
    protected $table = 'studi_whitelist';
    
    protected $fillable = [
        'user_id',
        'username',
        'added_by',
        'reason',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'added_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}