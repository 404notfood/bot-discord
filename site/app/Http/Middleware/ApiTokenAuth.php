<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?? $request->input('api_token') ?? $request->header('X-API-Token');
        $expectedToken = config('discord.api_secret');

        if (!$token || !$expectedToken || !hash_equals($expectedToken, $token)) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid API token'
            ], 401);
        }

        return $next($request);
    }
}