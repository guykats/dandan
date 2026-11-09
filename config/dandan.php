<?php

return [

    // 4-digit PIN that unlocks the parent screen. Checked server-side only.
    'parent_pin' => env('PARENT_PIN'),

    // How long the parent screen stays unlocked after a correct PIN.
    'parent_unlock_minutes' => 60,

    // Exercises per round.
    'round_size' => 10,

    // Number of answer buttons shown per exercise.
    'choices' => 4,

    // One sticker unlocks every N stars.
    'stars_per_sticker' => 20,

    // Promotion from level 10 to level 20: this many consecutive rounds
    // with at least `promotion_min_correct` first-try correct answers.
    'promotion_rounds' => 3,
    'promotion_min_correct' => 8,

    'levels' => [10, 20],
];
