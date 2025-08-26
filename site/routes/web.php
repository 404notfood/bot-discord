<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

// Route de test pour les modèles
Route::get('/test-models', function () {
    try {
        $adminCount = App\Models\BotAdmin::count();
        $memberCount = App\Models\DashboardMember::count();
        $projectCount = App\Models\MainProject::count();
        
        return response()->json([
            'success' => true,
            'data' => [
                'bot_admins' => $adminCount,
                'dashboard_members' => $memberCount,
                'main_projects' => $projectCount
            ]
        ]);
    } catch (Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
});

// Test simple documentation SANS authentification
Route::get('documentation', function () {
    return response()->json(['message' => 'Documentation route works!', 'timestamp' => now()]);
})->name('documentation.index');

Route::middleware(['auth', 'verified'])->group(function () {
    // Main Dashboard - Now using the futuristic version
    Route::get('dashboard', function () {
        return inertia('dashboard-futuristic');
    })->name('dashboard');
    
    // Keep control-center as alias
    Route::get('control-center', function () {
        return inertia('dashboard-futuristic');
    })->name('control-center');
    
    Route::get('bot-management', function () {
        return inertia('bot-management');
    })->name('bot-management');
    
    Route::get('studi-defense', function () {
        return inertia('studi-defense');
    })->name('studi-defense');
    
    Route::get('task-scheduler', function () {
        return inertia('task-scheduler');
    })->name('task-scheduler');
    
    // Routes pour les pages avec design futuriste
    Route::get('members', function () {
        return inertia('members');
    })->name('members.index');
    
    Route::get('logs', function () {
        return inertia('logs');
    })->name('logs.index');
    
    Route::get('config', function () {
        return inertia('config');
    })->name('config.index');
    
    Route::get('projects', function () {
        return inertia('projects');
    })->name('projects.index');
    
    // Routes de gestion de la documentation - Temporairement désactivées
    /*
    Route::prefix('documentation')->name('documentation.')->group(function () {
        // Gestion des catégories
        Route::resource('categories', \App\Http\Controllers\DocCategoryController::class, [
            'as' => 'doc-categories'
        ]);
        Route::post('categories/{docCategory}/toggle-active', [\App\Http\Controllers\DocCategoryController::class, 'toggleActive'])
             ->name('doc-categories.toggle-active');
        Route::post('categories/reorder', [\App\Http\Controllers\DocCategoryController::class, 'reorder'])
             ->name('doc-categories.reorder');
        
        // Gestion des ressources
        Route::resource('resources', \App\Http\Controllers\DocResourceController::class, [
            'as' => 'doc-resources'
        ]);
        Route::post('resources/{docResource}/toggle-active', [\App\Http\Controllers\DocResourceController::class, 'toggleActive'])
             ->name('doc-resources.toggle-active');
        Route::post('resources/{docResource}/duplicate', [\App\Http\Controllers\DocResourceController::class, 'duplicate'])
             ->name('doc-resources.duplicate');
        Route::get('resources-export', [\App\Http\Controllers\DocResourceController::class, 'export'])
             ->name('doc-resources.export');
    });
    */
    
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
