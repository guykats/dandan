<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['stars'])]
class KidProfile extends Model
{
    protected $attributes = [
        'stars' => 0,
    ];

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1]);
    }

    public function stickersUnlocked(): int
    {
        return intdiv($this->stars, (int) config('dandan.stars_per_sticker'));
    }
}
