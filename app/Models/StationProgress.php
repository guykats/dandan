<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['station', 'best_stars', 'plays', 'completed_at'])]
class StationProgress extends Model
{
    protected $table = 'station_progress';

    protected $primaryKey = 'station';

    public $incrementing = false;

    protected $attributes = [
        'best_stars' => 0,
        'plays' => 0,
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
        ];
    }
}
