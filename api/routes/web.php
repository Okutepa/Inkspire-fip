<?php

/** @var \Laravel\Lumen\Routing\Router $router */

// Health check route
$router->get('/', function () {
    return response()->json(['message' => 'Inkspire Tattoo API is running']);
});

// Auth routes
$router->group(['prefix' => 'api'], function () use ($router) {
    // Public auth endpoints
    $router->post('login', 'AuthController@login');
    $router->post('register', 'AuthController@register'); // Add register route
    
    // Protected auth endpoints
    $router->group(['middleware' => 'auth'], function () use ($router) {
        $router->get('me', 'AuthController@me');
        $router->post('logout', 'AuthController@logout');
        $router->post('refresh', 'AuthController@refresh');
    });
});

// Protected API routes (require authentication)
$router->group(['prefix' => 'api', 'middleware' => 'auth'], function () use ($router) {
    // Artist write/delete routes
    $router->post('artists', 'ArtistController@store');
    $router->put('artists/{id}', 'ArtistController@update');
    $router->delete('artists/{id}', 'ArtistController@destroy');
    
    // Tattoo write/delete routes
    $router->post('tattoos', 'TattooController@store');
    $router->put('tattoos/{id}', 'TattooController@update');
    $router->delete('tattoos/{id}', 'TattooController@destroy');
});

// Public API routes (no authentication needed)
$router->group(['prefix' => 'api'], function () use ($router) {
    // Artist read-only routes
    $router->get('artists', 'ArtistController@index');
    $router->get('artists/{id}', 'ArtistController@show');
    
    // Tattoo read-only routes
    $router->get('tattoos', 'TattooController@index');
    $router->get('tattoos/{id}', 'TattooController@show');
    $router->get('artists/{artistId}/tattoos', 'TattooController@getByArtist');
    
    // Contact routes (public for now)
    $router->get('contact', 'ContactController@index');
    $router->post('contact', 'ContactController@store');
});