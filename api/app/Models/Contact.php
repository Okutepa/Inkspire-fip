<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $table = 'contact';
    protected $fillable = ['name', 'email', 'message'];
    protected $primaryKey = 'contact_id';
    public $timestamps = true;

    // Add these constants to override default timestamp columns
    const CREATED_AT = 'submitted_at';
    const UPDATED_AT = 'updated_at';
}