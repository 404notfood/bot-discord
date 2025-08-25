<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectSubgroup extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'subgroups';
    
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'leader_id',
        'leader_username',
        'channel_id',
        'role_id',
        'max_members'
    ];
    
    /**
     * Get the project that owns the subgroup.
     */
    public function project()
    {
        return $this->belongsTo(\App\Models\MainProject::class, 'project_id');
    }
    
    /**
     * Get the members of the subgroup.
     */
    public function members()
    {
        return $this->hasMany(\App\Models\ProjectGroupMember::class, 'subgroup_id');
    }
}
