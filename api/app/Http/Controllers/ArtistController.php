<?php

namespace App\Http\Controllers;

use App\Models\Artist;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
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
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'bio' => 'required|string',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'specialties' => 'nullable|string',
                'experience' => 'nullable|integer|min:0',
                'social' => 'nullable|string',
                'user_id' => 'required|exists:users,user_id',
            ], [
                'name.required' => 'The artist name is required.',
                'bio.required' => 'The artist bio is required.',
                'photo.image' => 'The uploaded file must be an image (JPEG, PNG, JPG, or GIF).',
                'photo.mimes' => 'The image must be a JPEG, PNG, JPG, or GIF file.',
                'photo.max' => 'The image size must not exceed 2MB.',
                'experience.integer' => 'Years of experience must be a whole number.',
                'experience.min' => 'Years of experience cannot be negative.',
                'user_id.required' => 'A user ID is required.',
                'user_id.exists' => 'The provided user ID does not exist.',
            ]);
    
            $artist = new Artist();
            $artist->name = $request->input('name');
            $artist->bio = $request->input('bio');
            $artist->user_id = $request->input('user_id');
    
            if ($request->has('specialties')) {
                $artist->specialties = $request->input('specialties');
            }
            if ($request->has('experience')) {
                $artist->experience = $request->input('experience');
            }
            if ($request->has('social')) {
                $artist->social = $request->input('social');
            }
    
            if ($request->hasFile('photo')) {
                $photo = $request->file('photo');
                $filename = time() . '_' . $photo->getClientOriginalName();
                $path = $photo->storeAs('artists', $filename, 'public');
                $artist->photo_path = $path;
            }
    
            $artist->save();
    
            return response()->json([
                'id' => $artist->artist_id,
                'artist_id' => $artist->artist_id,
                'name' => $artist->name,
                'bio' => $artist->bio,
                'photo_path' => $artist->photo_path,
                'photo_url' => $artist->photo_path ? Storage::url($artist->photo_path) : null,
                'specialties' => $artist->specialties,
                'experience' => $artist->experience,
                'social' => $artist->social,
                'user_id' => $artist->user_id,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed', [
                'errors' => $e->errors(),
                'request_data' => $request->except('photo')
            ]);
            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating artist', [
                'message' => $e->getMessage(),
                'request_data' => $request->except('photo'),
                'stack' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to create artist',
                'details' => $e->getMessage()
            ], 500);
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
            Log::info('Artist update request received', [
                'id' => $id,
                'has_file' => $request->hasFile('photo'),
                'all_inputs' => $request->except(['photo'])
            ]);

            $this->validate($request, [
                'name' => 'sometimes|required|string|max:255',
                'bio' => 'sometimes|required|string',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'specialties' => 'nullable|string',
                'experience' => 'nullable|integer|min:0',
                'social' => 'nullable|string',
            ], [
                'name.required' => 'The artist name is required.',
                'bio.required' => 'The artist bio is required.',
                'photo.image' => 'The uploaded file must be an image (JPEG, PNG, JPG, or GIF).',
                'photo.mimes' => 'The image must be a JPEG, PNG, JPG, or GIF file.',
                'photo.max' => 'The image size must not exceed 2MB.',
                'experience.integer' => 'Years of experience must be a whole number.',
                'experience.min' => 'Years of experience cannot be negative.',
            ]);

            $artist = Artist::findOrFail($id);
            Log::info('Found artist for update', ['artist' => $artist->toArray()]);

            if ($request->has('name')) {
                $artist->name = $request->input('name');
                Log::info('Updating artist name', ['new_name' => $request->input('name')]);
            }
            
            if ($request->has('bio')) {
                $artist->bio = $request->input('bio');
                Log::info('Updating artist bio', ['new_bio' => $request->input('bio')]);
            }
            
            if ($request->has('specialties')) {
                $artist->specialties = $request->input('specialties');
                Log::info('Updating artist specialties', ['new_specialties' => $request->input('specialties')]);
            }
            
            if ($request->has('experience')) {
                $artist->experience = $request->input('experience');
                Log::info('Updating artist experience', ['new_experience' => $request->input('experience')]);
            }
            
            if ($request->has('social')) {
                $artist->social = $request->input('social');
                Log::info('Updating artist social media', ['new_social' => $request->input('social')]);
            }

            if ($request->hasFile('photo')) {
                Log::info('New photo uploaded', ['original_name' => $request->file('photo')->getClientOriginalName()]);
                
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

            $saved = $artist->save();
            Log::info('Artist update saved', ['success' => $saved]);

            return response()->json([
                'id' => $artist->artist_id,
                'artist_id' => $artist->artist_id,
                'name' => $artist->name,
                'bio' => $artist->bio,
                'photo_path' => $artist->photo_path,
                'photo_url' => $artist->photo_path ? Storage::url($artist->photo_path) : null,
                'specialties' => $artist->specialties,
                'experience' => $artist->experience,
                'social' => $artist->social,
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
    
    /**
     * Get all tattoos for a specific artist.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTattoos($id)
    {
        try {
            $artist = Artist::findOrFail($id);
            $tattoos = $artist->tattoos;
            return response()->json($tattoos);
        } catch (\Exception $e) {
            Log::error('Error fetching artist tattoos', [
                'id' => $id,
                'message' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to fetch artist tattoos'], 500);
        }
    }

    /**
     * Get the authenticated artist's profile.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMyProfile()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            $artist = Artist::where('user_id', $user->user_id)->first();
            if (!$artist) {
                return response()->json(['error' => 'Artist profile not found'], 404);
            }

            if ($artist->photo_path) {
                $artist->photo_url = Storage::url($artist->photo_path);
            }

            return response()->json([
                'id' => $artist->artist_id, // Explicitly include id field
                'artist_id' => $artist->artist_id,
                'name' => $artist->name,
                'bio' => $artist->bio,
                'experience' => $artist->experience,
                'specialties' => $artist->specialties,
                'social' => $artist->social,
                'photo_path' => $artist->photo_path,
                'photo_url' => $artist->photo_url,
                'user_id' => $artist->user_id,
                'created_at' => $artist->created_at,
                'updated_at' => $artist->updated_at
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching artist profile', [
                'message' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to fetch artist profile', 'details' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Update the authenticated artist's profile.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateMyProfile(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }
            
            $artist = Artist::where('user_id', $user->user_id)->first();
            if (!$artist) {
                return response()->json(['error' => 'Artist profile not found'], 404);
            }
            
            $this->validate($request, [
                'name' => 'sometimes|required|string|max:255',
                'bio' => 'sometimes|required|string',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'specialties' => 'nullable|string',
                'experience' => 'nullable|integer|min:0',
                'social' => 'nullable|string',
            ], [
                'name.required' => 'The artist name is required.',
                'bio.required' => 'The artist bio is required.',
                'photo.image' => 'The uploaded file must be an image (JPEG, PNG, JPG, or GIF).',
                'photo.mimes' => 'The image must be a JPEG, PNG, JPG, or GIF file.',
                'photo.max' => 'The image size must not exceed 2MB.',
                'experience.integer' => 'Years of experience must be a whole number.',
                'experience.min' => 'Years of experience cannot be negative.',
            ]);
            
            if ($request->has('name')) {
                $user->name = $request->input('name');
                $user->save();
                $artist->name = $request->input('name');
            }
            
            if ($request->has('bio')) {
                $artist->bio = $request->input('bio');
            }
            
            if ($request->has('specialties')) {
                $artist->specialties = $request->input('specialties');
            }
            
            if ($request->has('experience')) {
                $artist->experience = $request->input('experience');
            }
            
            if ($request->has('social')) {
                $artist->social = $request->input('social');
            }
            
            if ($request->hasFile('photo')) {
                if ($artist->photo_path) {
                    Storage::disk('public')->delete($artist->photo_path);
                }
                
                $photo = $request->file('photo');
                $filename = time() . '_' . $photo->getClientOriginalName();
                $path = $photo->storeAs('artists', $filename, 'public');
                $artist->photo_path = $path;
            }
            
            $artist->save();
            
            if ($artist->photo_path) {
                $artist->photo_url = Storage::url($artist->photo_path);
            }
            
            return response()->json([
                'id' => $artist->artist_id,
                'artist_id' => $artist->artist_id,
                'name' => $artist->name,
                'bio' => $artist->bio,
                'experience' => $artist->experience,
                'specialties' => $artist->specialties,
                'social' => $artist->social,
                'photo_path' => $artist->photo_path,
                'photo_url' => $artist->photo_url,
                'user_id' => $artist->user_id,
                'created_at' => $artist->created_at,
                'updated_at' => $artist->updated_at,
                'message' => 'Profile updated successfully'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed during artist profile update', ['errors' => $e->errors()]);
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating artist profile', [
                'message' => $e->getMessage(),
                'stack' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to update artist profile', 'details' => $e->getMessage()], 500);
        }
    }
}