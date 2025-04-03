<?php
namespace App\Http\Controllers;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        try {
            $this->validate($request, [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'message' => 'required|string'
            ]);
            $contact = Contact::create($request->all());
            return response()->json($contact, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Error creating contact', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create contact', 'details' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        try {
            $contacts = Contact::all();
            return response()->json($contacts);
        } catch (\Exception $e) {
            Log::error('Error fetching contacts', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to fetch contacts', 'details' => $e->getMessage()], 500);
        }
    }
}