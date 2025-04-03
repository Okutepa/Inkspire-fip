<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Tattoo extends Model
{
    protected $fillable = ['title', 'description', 'artist_id', 'file_path'];
    protected $primaryKey = 'tattoo_id';
    public $timestamps = true;

    public function artist()
    {
        return $this->belongsTo('App\Models\Artist', 'artist_id');
    }
}