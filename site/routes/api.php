<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DiscordController;
use App\Http\Controllers\Api\ModerationController;
use App\Http\Controllers\Api\ProjectsApiController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SchedulerController;
use App\Http\Controllers\Api\StudiController;
use App\Http\Controllers\Api\DocumentationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes API pour l'intégration avec le bot Discord
|
*/

// Routes publiques (avec authentification par token API)
Route::middleware(['throttle:api'])->group(function () {
    
    // Health check
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
            'version' => '1.0.0'
        ]);
    });

    // Routes Discord Bot (authentifiées par token)
    Route::middleware('auth.api.token')->prefix('discord')->group(function () {
        
        // Statistiques générales
        Route::get('/stats', [StatsController::class, 'index']);
        Route::get('/stats/dashboard', [StatsController::class, 'dashboard']);
        
        // Modération
        Route::prefix('moderation')->group(function () {
            Route::get('/logs', [ModerationController::class, 'logs']);
            Route::post('/logs', [ModerationController::class, 'store']);
            Route::get('/logs/{id}', [ModerationController::class, 'show']);
            Route::put('/logs/{id}', [ModerationController::class, 'update']);
        });
        
        // Membres et utilisateurs
        Route::prefix('members')->group(function () {
            Route::get('/', [DiscordController::class, 'members']);
            Route::get('/{id}', [DiscordController::class, 'member']);
            Route::post('/{id}/ban', [DiscordController::class, 'banMember']);
            Route::delete('/{id}/ban', [DiscordController::class, 'unbanMember']);
        });
        
        // Administrateurs du bot
        Route::prefix('bot-admins')->group(function () {
            Route::get('/', [DiscordController::class, 'botAdmins']);
            Route::post('/', [DiscordController::class, 'addBotAdmin']);
            Route::delete('/{userId}', [DiscordController::class, 'removeBotAdmin']);
        });
        
        // Modérateurs du bot  
        Route::prefix('bot-moderators')->group(function () {
            Route::get('/', [DiscordController::class, 'botModerators']);
            Route::post('/', [DiscordController::class, 'addBotModerator']);
            Route::delete('/{userId}', [DiscordController::class, 'removeBotModerator']);
        });
        
        // Synchronisation des utilisateurs
        Route::prefix('sync')->group(function () {
            Route::post('/users', [DiscordController::class, 'syncUsers']);
            Route::get('/stats', [DiscordController::class, 'syncStats']);
        });
        
        // Projets
        Route::prefix('projects')->group(function () {
            Route::get('/', [ProjectsApiController::class, 'index']);
            Route::post('/', [ProjectsApiController::class, 'store']);
            Route::get('/stats', [ProjectsApiController::class, 'stats']);
            Route::get('/{id}', [ProjectsApiController::class, 'show']);
            Route::put('/{id}', [ProjectsApiController::class, 'update']);
            Route::delete('/{id}', [ProjectsApiController::class, 'destroy']);
            
            // Sous-groupes d'un projet spécifique
            Route::get('/{id}/subgroups', [ProjectsApiController::class, 'subgroups']);
            Route::post('/{id}/subgroups', [ProjectsApiController::class, 'createSubgroup']);
        });

        // Sous-groupes (global)
        Route::prefix('subgroups')->group(function () {
            Route::get('/', [ProjectsApiController::class, 'listSubgroups']);
            Route::get('/{id}', [ProjectsApiController::class, 'showSubgroup']);
            Route::put('/{id}', [ProjectsApiController::class, 'updateSubgroup']);
            Route::delete('/{id}', [ProjectsApiController::class, 'deleteSubgroup']);
            
            // Gestion des membres
            Route::get('/{id}/members', [ProjectsApiController::class, 'subgroupMembers']);
            Route::post('/{id}/members', [ProjectsApiController::class, 'addToSubgroup']);
            Route::delete('/{id}/members/{userId}', [ProjectsApiController::class, 'removeFromSubgroup']);
        });

        // Planificateur de tâches
        Route::prefix('scheduler')->group(function () {
            Route::get('/', [SchedulerController::class, 'index']);
            Route::get('/config', [SchedulerController::class, 'config']);
            Route::put('/config', [SchedulerController::class, 'updateConfig']);
            Route::put('/{taskName}/toggle', [SchedulerController::class, 'toggle']);
            Route::post('/{taskName}/execute', [SchedulerController::class, 'execute']);
        });

        // Système Anti-Studi
        Route::prefix('studi')->group(function () {
            Route::get('/config', [StudiController::class, 'config']);
            Route::put('/config', [StudiController::class, 'updateConfig']);
            Route::get('/status', [StudiController::class, 'status']);
            Route::get('/dashboard', [StudiController::class, 'dashboard']);
            Route::post('/init', [StudiController::class, 'initializeDatabase']);
            
            // Utilisateurs bannis
            Route::get('/banned', [StudiController::class, 'bannedUsers']);
            Route::post('/ban', [StudiController::class, 'banUser']);
            Route::delete('/ban/{userId}', [StudiController::class, 'unbanUser']);
            
            // Whitelist
            Route::get('/whitelist', [StudiController::class, 'whitelist']);
            Route::post('/whitelist', [StudiController::class, 'addToWhitelist']);
            Route::delete('/whitelist/{userId}', [StudiController::class, 'removeFromWhitelist']);
        });

        // Documentation
        Route::prefix('docs')->group(function () {
            Route::get('/search', [DocumentationController::class, 'search']);
            Route::get('/stats', [DocumentationController::class, 'stats']);
            
            // Catégories
            Route::get('/categories', [DocumentationController::class, 'categories']);
            Route::post('/categories', [DocumentationController::class, 'createCategory']);
            Route::put('/categories/{id}', [DocumentationController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [DocumentationController::class, 'deleteCategory']);
            
            // Ressources
            Route::get('/resources', [DocumentationController::class, 'resources']);
            Route::get('/resources/{id}', [DocumentationController::class, 'showResource']);
            Route::post('/resources', [DocumentationController::class, 'createResource']);
            Route::put('/resources/{id}', [DocumentationController::class, 'updateResource']);
            Route::delete('/resources/{id}', [DocumentationController::class, 'deleteResource']);
        });
        
        // Contrôle du bot
        Route::prefix('bot-control')->group(function () {
            Route::get('/status', [App\Http\Controllers\Api\BotControlController::class, 'status']);
            Route::post('/start', [App\Http\Controllers\Api\BotControlController::class, 'start']);
            Route::post('/stop', [App\Http\Controllers\Api\BotControlController::class, 'stop']);
            Route::post('/restart', [App\Http\Controllers\Api\BotControlController::class, 'restart']);
            Route::get('/logs', [App\Http\Controllers\Api\BotControlController::class, 'logs']);
        });

        // Configuration
        Route::prefix('config')->group(function () {
            Route::get('/', [DiscordController::class, 'config']);
            Route::put('/{key}', [DiscordController::class, 'updateConfig']);
        });
        
        // Webhooks pour les événements Discord
        Route::post('/webhook/member-join', [DiscordController::class, 'memberJoin']);
        Route::post('/webhook/member-leave', [DiscordController::class, 'memberLeave']);
        Route::post('/webhook/message-delete', [DiscordController::class, 'messageDelete']);
    });
});

// Routes d'authentification par API token
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});