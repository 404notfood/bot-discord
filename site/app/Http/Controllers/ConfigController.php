<?php

namespace App\Http\Controllers;

use App\Models\BotConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfigController extends Controller
{
    public function index()
    {
        // Récupérer toutes les configurations
        $configs = BotConfig::all()->keyBy('config_key')->map(function ($config) {
            return [
                'id' => $config->id,
                'key' => $config->config_key,
                'value' => $config->config_value,
                'description' => $config->description ?? '',
                'type' => $this->getConfigType($config->config_key),
                'category' => $this->getConfigCategory($config->config_key),
            ];
        });

        // Organiser par catégories
        $categorized_configs = [
            'general' => $configs->filter(fn($c) => $c['category'] === 'general')->values(),
            'moderation' => $configs->filter(fn($c) => $c['category'] === 'moderation')->values(),
            'logging' => $configs->filter(fn($c) => $c['category'] === 'logging')->values(),
            'features' => $configs->filter(fn($c) => $c['category'] === 'features')->values(),
        ];

        return Inertia::render('config/index', [
            'configs' => $categorized_configs,
            'stats' => [
                'total_configs' => $configs->count(),
                'categories' => count(array_filter($categorized_configs, fn($cat) => $cat->isNotEmpty())),
            ]
        ]);
    }

    public function update(Request $request)
    {
        $request->validate([
            'configs' => 'required|array',
            'configs.*.key' => 'required|string',
            'configs.*.value' => 'required|string',
        ]);

        foreach ($request->configs as $configData) {
            BotConfig::updateOrCreate(
                ['config_key' => $configData['key']],
                ['config_value' => $configData['value']]
            );
        }

        return redirect()->back()->with('success', 'Configuration mise à jour avec succès');
    }

    private function getConfigType(string $key): string
    {
        if (str_contains($key, 'enable') || str_contains($key, 'disabled')) {
            return 'boolean';
        }
        
        if (str_contains($key, 'channel') || str_contains($key, 'role') || str_contains($key, 'user')) {
            return 'id';
        }
        
        if (str_contains($key, 'prefix') || str_contains($key, 'message')) {
            return 'text';
        }
        
        if (str_contains($key, 'limit') || str_contains($key, 'max') || str_contains($key, 'timeout')) {
            return 'number';
        }
        
        return 'text';
    }

    private function getConfigCategory(string $key): string
    {
        if (str_contains($key, 'moderation') || str_contains($key, 'ban') || str_contains($key, 'kick') || str_contains($key, 'warn')) {
            return 'moderation';
        }
        
        if (str_contains($key, 'log') || str_contains($key, 'audit')) {
            return 'logging';
        }
        
        if (str_contains($key, 'feature') || str_contains($key, 'command') || str_contains($key, 'module')) {
            return 'features';
        }
        
        return 'general';
    }
}
