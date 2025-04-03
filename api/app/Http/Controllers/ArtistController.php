<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ArtistController extends Controller
{
    public function index()
    {
        try {
            $artists = Artist::all(); // Add with('tattoos') if applicable
            return response()->json($artists);
        } catch (\Exception $e) {
            Log::error('Error fetching artists', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch artists', 'details' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $artist = Artist::findOrFail($id);
            return response()->json($artist);
        } catch (\Exception $e) {
            Log::error('Error fetching artist', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Artist not found', 'details' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'bio' => 'required|string',
                'photo_path' => 'nullable|string|max:500'
            ]);
            $artist = Artist::create($request->all());
            return response()->json($artist, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating artist', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create artist', 'details' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $this->validate($request, [
                'name' => 'sometimes|required|string|max:255',
                'bio' => 'sometimes|required|string',
                'photo_path' => 'nullable|string|max:500'
            ]);
            $artist = Artist::findOrFail($id);
            $artist->update($request->all());
            return response()->json($artist, 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating artist', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to update artist', 'details' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Artist::findOrFail($id)->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting artist', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to delete artist', 'details' => $e->getMessage()], 500);
        }
    }
}