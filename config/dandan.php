<?php

return [

    // 4-digit PIN that unlocks the parent screen. Checked server-side only.
    'parent_pin' => env('PARENT_PIN'),

    // How long the parent screen stays unlocked after a correct PIN.
    'parent_unlock_minutes' => 60,

    // Exercises per round.
    'round_size' => 10,

    // Number of answer buttons shown per numeric exercise.
    'choices' => 4,

    // One sticker unlocks every N stars (a star per first-try correct answer).
    'stars_per_sticker' => 20,
];
