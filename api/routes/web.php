<?php

/** @var \Laravel\Lumen\Routing\Router $router */

// Health check route
$router->get('/', function () {
    return response()->json(['message' => 'Inkspire Tattoo API is running']);
});

// API routes
$router->group(['prefix' => 'api'], function () use ($router) {
    // Artist routes
    $router->get('artists', 'ArtistController@index');
    $router->get('artists/{id}', 'ArtistController@show');
    $router->post('artists', 'ArtistController@store');
    $router->put('artists/{id}', 'ArtistController@update');
    $router->delete('artists/{id}', 'ArtistController@destroy');
    $router->post('contact', 'ContactController@store');
    
    // Tattoo routes
    $router->get('tattoos', 'TattooController@index');
    $router->get('tattoos/{id}', 'TattooController@show');
    $router->post('tattoos', 'TattooController@store');
    $router->put('tattoos/{id}', 'TattooController@update');
    $router->delete('tattoos/{id}', 'TattooController@destroy');
    $router->get('artists/{artistId}/tattoos', 'TattooController@getByArtist');
    $router->get('contact', 'ContactController@index');
});