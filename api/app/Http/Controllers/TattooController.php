<?php
namespace App\Http\Controllers;
use App\Models\Tattoo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TattooController extends Controller
{
    public function index()
    {
        try {
            $tattoos = Tattoo::with('artist')->paginate(10);
            return response()->json($tattoos);
        } catch (\Exception $e) {
            Log::error('Error fetching tattoos', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch tattoos', 'details' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $tattoo = Tattoo::findOrFail($id);
            return response()->json($tattoo);
        } catch (\Exception $e) {
            Log::error('Error fetching tattoo', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Tattoo not found', 'details' => $e->getMessage()], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'artist_id' => 'nullable|integer|exists:artists,artist_id',
                'file_path' => 'nullable|image|max:2048'
            ]);
    
            $data = $request->all(); // Get all input data
            if ($request->hasFile('file_path')) {
                $file = $request->file('file_path');
                $path = $file->store('tattoos', 'public'); // Store and get path
                $data['file_path'] = $path; // Override file_path with stored path
            }
    
            $tattoo = Tattoo::create($data);
            return response()->json($tattoo, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating tattoo', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create tattoo', 'details' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $this->validate($request, [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'artist_id' => 'nullable|integer',
                'file_path' => 'nullable|string|max:500'
            ]);

            $tattoo = Tattoo::findOrFail($id);
            $tattoo->update($request->all());
            return response()->json($tattoo, 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error updating tattoo', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to update tattoo', 'details' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Tattoo::findOrFail($id)->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Error deleting tattoo', ['id' => $id, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to delete tattoo', 'details' => $e->getMessage()], 500);
        }
    }

    public function getByArtist($artistId)
    {
        try {
            $tattoos = Tattoo::where('artist_id', $artistId)->get(); // Or use Artist::findOrFail($artistId)->tattoos
            return response()->json($tattoos);
        } catch (\Exception $e) {
            Log::error('Error fetching tattoos by artist', ['artist_id' => $artistId, 'message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch tattoos', 'details' => $e->getMessage()], 500);
        }
    }
}