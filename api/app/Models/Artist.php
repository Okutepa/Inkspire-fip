<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Artist extends Model
{
    protected $fillable = ['name', 'bio', 'photo_path', 'specialties', 'experience', 'social', 'user_id'];
    protected $primaryKey = 'artist_id';
    public $timestamps = true;

    public function tattoos()
    {
        return $this->hasMany('App\Models\Tattoo', 'artist_id');
    }
}