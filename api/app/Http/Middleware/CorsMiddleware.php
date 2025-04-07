<?php

namespace App\Http\Middleware;

use Closure;

class CorsMiddleware
{
    public function handle($request, Closure $next)
    {
        // Update these to match your development environment
        $headers = [
            'Access-Control-Allow-Origin'      => '*', // Allow all origins for testing, or use http://localhost:8888
            'Access-Control-Allow-Methods'     => 'POST, GET, OPTIONS, PUT, DELETE',
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Max-Age'           => '86400',
            'Access-Control-Allow-Headers'     => 'Content-Type, Authorization, X-Requested-With'
        ];

        // Handle preflight requests
        if ($request->isMethod('OPTIONS')) {
            return response()->json('', 200, $headers);
        }

        $response = $next($request);
        
        // Add CORS headers to the response
        foreach ($headers as $key => $value) {
            $response->header($key, $value);
        }

        return $response;
    }
}