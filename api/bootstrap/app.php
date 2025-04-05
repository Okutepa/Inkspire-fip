<?php

require_once __DIR__.'/../vendor/autoload.php';

try {
    (new Laravel\Lumen\Bootstrap\LoadEnvironmentVariables(
        dirname(__DIR__)
    ))->bootstrap();
} catch (Exception $e) {
    die("Failed to load environment variables: " . $e->getMessage());
}

date_default_timezone_set(env('APP_TIMEZONE', 'UTC'));

$app = new Laravel\Lumen\Application(
    dirname(__DIR__)
);

$app->withFacades();
$app->withEloquent();

// Register container bindings for better error handling
$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

// Load auth configuration
$app->configure('auth');

// Register middleware
$app->middleware([
    App\Http\Middleware\CorsMiddleware::class
]);

// Register route middleware
$app->routeMiddleware([
    'cors' => App\Http\Middleware\CorsMiddleware::class,
    'auth' => App\Http\Middleware\Authenticate::class,
]);

// Load configuration files
$app->configure('app');
$app->configure('database');

// Register JWT service provider
$app->register(Tymon\JWTAuth\Providers\LumenServiceProvider::class);

// Load routes
$app->router->group([
    'namespace' => 'App\Http\Controllers',
], function ($router) {
    require __DIR__.'/../routes/web.php';
});

return $app;