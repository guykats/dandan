<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['station', 'size', 'correct_first_try', 'stars', 'rating', 'finished_at'])]
class Round extends Model
{
    protected function casts(): array
    {
        return [
            'finished_at' => 'datetime',
        ];
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class)->orderBy('position');
    }

    public function scopeFinished(Builder $query): void
    {
        $query->whereNotNull('finished_at');
    }

    public function isFinished(): bool
    {
        return $this->finished_at !== null;
    }
}
