<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\DashboardMember;

class DashboardMembersSeeder extends Seeder
{
    public function run(): void
    {
        DashboardMember::updateOrCreate(
            ['email' => 'admin@discord-bot.local'],
            [
                'username' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
                'created_at' => now(),
            ]
        );

        DashboardMember::updateOrCreate(
            ['email' => 'moderator@discord-bot.local'],
            [
                'username' => 'moderator',
                'password' => Hash::make('password'),
                'role' => 'editor',
                'is_active' => true,
                'created_at' => now(),
            ]
        );

        DashboardMember::updateOrCreate(
            ['email' => 'viewer@discord-bot.local'],
            [
                'username' => 'viewer',
                'password' => Hash::make('password'),
                'role' => 'viewer',
                'is_active' => true,
                'created_at' => now(),
            ]
        );
    }
}