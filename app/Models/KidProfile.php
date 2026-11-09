<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['level', 'stars', 'level_since'])]
class KidProfile extends Model
{
    protected $attributes = [
        'level' => 10,
        'stars' => 0,
    ];

    protected function casts(): array
    {
        return [
            'level_since' => 'datetime',
        ];
    }

    public function setLevel(int $level): void
    {
        $this->level = $level;
        $this->level_since = now();
    }

    public static function current(): self
    {
        return self::query()->firstOrCreate(['id' => 1]);
    }

    public function stickersUnlocked(): int
    {
        return intdiv($this->stars, (int) config('dandan.stars_per_sticker'));
    }
}
