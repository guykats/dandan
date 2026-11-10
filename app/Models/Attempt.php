<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['position', 'type', 'skill', 'label', 'operation', 'a', 'b', 'answer', 'first_choice', 'mistakes', 'correct_first_try'])]
class Attempt extends Model
{
    protected function casts(): array
    {
        return [
            'correct_first_try' => 'boolean',
        ];
    }

    public function round(): BelongsTo
    {
        return $this->belongsTo(Round::class);
    }
}
