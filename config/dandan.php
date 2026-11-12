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

    /*
    | Text to speech. "azure" makes the server synthesize Hebrew audio (cached on disk);
    | "browser" leaves speech to the browser's built-in voices.
    */
    'tts' => [
        'driver' => env('TTS_DRIVER', 'browser'),

        'azure' => [
            'key' => env('AZURE_SPEECH_KEY'),
            'region' => env('AZURE_SPEECH_REGION'),
            'voice' => env('AZURE_SPEECH_VOICE', 'he-IL-HilaNeural'),
            // A little slower and brighter than the default suits young children.
            'rate' => env('AZURE_SPEECH_RATE', '-10%'),
            'pitch' => env('AZURE_SPEECH_PITCH', '+5%'),
        ],

        // Longest sentence the endpoint will synthesize.
        'max_length' => 160,

        // Cap on new (uncached) syntheses per day, so a public endpoint can't drain the quota.
        'daily_new_limit' => 3000,
    ],
];
