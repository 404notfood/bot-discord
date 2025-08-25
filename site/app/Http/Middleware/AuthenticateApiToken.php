<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\BotConfig;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiToken = $request->header('X-API-Token') 
            ?? $request->header('Authorization')
            ?? $request->input('api_token');

        // Nettoyer le token si c'est un Bearer token
        if (str_starts_with($apiToken, 'Bearer ')) {
            $apiToken = substr($apiToken, 7);
        }

        if (!$apiToken) {
            return response()->json([
                'success' => false,
                'error' => 'API token required',
                'message' => 'Vous devez fournir un token API valide'
            ], 401);
        }

        // Récupérer le token valide depuis la configuration
        $validToken = BotConfig::getValue('api.secret_key', env('API_SECRET_KEY'));
        
        if (!$validToken) {
            return response()->json([
                'success' => false,
                'error' => 'API configuration error',
                'message' => 'Configuration API non trouvée'
            ], 500);
        }

        if (!hash_equals($validToken, $apiToken)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid API token',
                'message' => 'Token API invalide'
            ], 401);
        }

        // Ajouter le token validé à la requête pour un usage ultérieur
        $request->attributes->set('api_token_validated', true);

        return $next($request);
    }
}