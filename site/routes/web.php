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
    
    // Routes pour la gestion des membres
    Route::get('members', [App\Http\Controllers\MembersController::class, 'index'])->name('members.index');
    Route::get('members/{id}', [App\Http\Controllers\MembersController::class, 'show'])->name('members.show');
    Route::put('members/{id}', [App\Http\Controllers\MembersController::class, 'update'])->name('members.update');
    
    // Routes pour les logs de modération
    Route::get('logs', [App\Http\Controllers\LogsController::class, 'index'])->name('logs.index');
    Route::get('logs/{id}', [App\Http\Controllers\LogsController::class, 'show'])->name('logs.show');
    
    // Routes pour la configuration
    Route::get('config', [App\Http\Controllers\ConfigController::class, 'index'])->name('config.index');
    Route::put('config', [App\Http\Controllers\ConfigController::class, 'update'])->name('config.update');
    
    // Routes pour les projets
    Route::get('projects', [App\Http\Controllers\ProjectsController::class, 'index'])->name('projects.index');
    Route::get('projects/{id}', [App\Http\Controllers\ProjectsController::class, 'show'])->name('projects.show');
    Route::put('projects/{id}', [App\Http\Controllers\ProjectsController::class, 'update'])->name('projects.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
