<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ArtistController extends Controller
{
    /**
     * Display a listing of artists with pagination.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $artists = Artist::paginate(10);
            return response()->json($artists);
        } catch (\Exception $e) {
            Log::error('Error fetching artists', [
                'message' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to fetch artists'], 500);
        }
    }

    /**
     * Display a specific artist by ID.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $artist = Artist::findOrFail($id);
            return response()->json($artist);
        } catch (\Exception $e) {
            Log::error('Error fetching artist', [
                'id' => $id,
                'message' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Artist not found'], 404);
        }
    }

    /**
     * Store a newly created artist with an optional photo upload.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validate with custom messages
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'bio' => 'required|string',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ], [
                'name.required' => 'The artist name is required.',
                'bio.required' => 'The artist bio is required.',
                'photo.image' => 'The uploaded file must be an image (JPEG, PNG, JPG, or GIF).',
                'photo.mimes' => 'The image must be a JPEG, PNG, JPG, or GIF file.',
                'photo.max' => 'The image size must not exceed 2MB.',
            ]);

            // Create a new artist instance
            $artist = new Artist();
            $artist->name = $request->input('name');
            $artist->bio = $request->input('bio');

            // Handle photo upload if provided
            if ($request->hasFile('photo')) {
                $photo = $request->file('photo');
                $filename = time() . '_' . $photo->getClientOriginalName();
                $path = $photo->storeAs('artists', $filename, 'public');
                $artist->photo_path = $path;
            }

            $artist->save();

            // Return response with photo_url
            return response()->json([
                'id' => $artist->id,
                'name' => $artist->name,
                'bio' => $artist->bio,
                'photo_path' => $artist->photo_path,
                'photo_url' => $artist->photo_path ? Storage::url($artist->photo_path) : null,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating artist', [
                'message' => $e->getMessage(),
                'request_data' => $request->except('photo'), // Exclude photo to avoid logging large data
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to create artist'], 500);
        }
    }

    /**
     * Update an existing artist with optional photo replacement.
     *
     * @param \Illuminate\Http\Request $request
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            // Log the incoming request for debugging
            Log::info('Artist update request received', [
                'id' => $id,
                'has_file' => $request->hasFile('photo'),
                'all_inputs' => $request->all()
            ]);

            // Validate with custom messages
            $this->validate($request, [
                'name' => 'sometimes|required|string|max:255',
                'bio' => 'sometimes|required|string',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ], [
                'name.required' => 'The artist name is required.',
                'bio.required' => 'The artist bio is required.',
                'photo.image' => 'The uploaded file must be an image (JPEG, PNG, JPG, or GIF).',
                'photo.mimes' => 'The image must be a JPEG, PNG, JPG, or GIF file.',
                'photo.max' => 'The image size must not exceed 2MB.',
            ]);

            // Find the artist
            $artist = Artist::findOrFail($id);
            Log::info('Found artist for update', ['artist' => $artist->toArray()]);

            // Update name if provided
            if ($request->has('name')) {
                $artist->name = $request->input('name');
                Log::info('Updating artist name', ['new_name' => $request->input('name')]);
            }
            
            // Update bio if provided
            if ($request->has('bio')) {
                $artist->bio = $request->input('bio');
                Log::info('Updating artist bio', ['new_bio' => $request->input('bio')]);
            }

            // Handle new photo upload if provided
            if ($request->hasFile('photo')) {
                Log::info('New photo uploaded', ['original_name' => $request->file('photo')->getClientOriginalName()]);
                
                // Delete the old photo if it exists
                if ($artist->photo_path) {
                    Storage::disk('public')->delete($artist->photo_path);
                    Log::info('Deleted old photo', ['path' => $artist->photo_path]);
                }
                
                $photo = $request->file('photo');
                $filename = time() . '_' . $photo->getClientOriginalName();
                $path = $photo->storeAs('artists', $filename, 'public');
                $artist->photo_path = $path;
                Log::info('New photo path set', ['path' => $path]);
            }

            // Save the changes
            $saved = $artist->save();
            Log::info('Artist update saved', ['success' => $saved]);

            // Return the updated artist with photo URL
            return response()->json([
                'id' => $artist->id,
                'name' => $artist->name,
                'bio' => $artist->bio,
                'photo_path' => $artist->photo_path,
                'photo_url' => $artist->photo_path ? Storage::url($artist->photo_path) : null,
                'message' => 'Artist updated successfully'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Artist not found for update', ['id' => $id]);
            return response()->json(['error' => 'Artist not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed during artist update', ['errors' => $e->errors()]);
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating artist', [
                'id' => $id,
                'message' => $e->getMessage(),
                'request_data' => $request->except('photo'),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to update artist: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove an artist and its associated photo.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            DB::transaction(function () use ($id) {
                $artist = Artist::findOrFail($id);
                if ($artist->photo_path) {
                    Storage::disk('public')->delete($artist->photo_path);
                }
                $artist->delete();
            });
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting artist', [
                'id' => $id,
                'message' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to delete artist'], 500);
        }
    }
}