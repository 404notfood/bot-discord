<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\DiscordController;
use App\Http\Controllers\Api\ModerationController;
use App\Http\Controllers\Api\ProjectsApiController;
use App\Http\Controllers\Api\StatsController;

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
        
        // Projets
        Route::prefix('projects')->group(function () {
            Route::get('/', [ProjectsApiController::class, 'index']);
            Route::post('/', [ProjectsApiController::class, 'store']);
            Route::get('/{id}', [ProjectsApiController::class, 'show']);
            Route::put('/{id}', [ProjectsApiController::class, 'update']);
            Route::delete('/{id}', [ProjectsApiController::class, 'destroy']);
            
            // Sous-groupes
            Route::get('/{id}/subgroups', [ProjectsApiController::class, 'subgroups']);
            Route::post('/{id}/subgroups', [ProjectsApiController::class, 'createSubgroup']);
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