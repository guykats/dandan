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
    | Text to speech. "google" or "azure" makes the server synthesize Hebrew audio (cached on disk);
    | "browser" leaves speech to the browser's built-in voices.
    */
    'tts' => [
        'driver' => env('TTS_DRIVER', 'browser'),

        'google' => [
            'key' => env('GOOGLE_TTS_KEY'),
            'voice' => env('GOOGLE_TTS_VOICE', 'he-IL-Chirp3-HD-Aoede'),
        ],

        'azure' => [
            'key' => env('AZURE_SPEECH_KEY'),
            'region' => env('AZURE_SPEECH_REGION'),
            'voice' => env('AZURE_SPEECH_VOICE', 'he-IL-HilaNeural'),
            'pitch' => env('AZURE_SPEECH_PITCH', '+5%'),
        ],

        // Speaking speed for both providers: 1.0 is normal; slower suits young children.
        'rate' => (float) env('TTS_RATE', 0.8),

        // Speeds offered in the parent voice lab.
        'rates' => [1.0, 0.9, 0.8, 0.7, 0.6],

        // How numbers are sent to the engine: digits, words (no vowel marks) or nikud (with vowel marks).
        'numbers' => env('TTS_NUMBERS', 'words'),

        // Longest sentence the endpoint will synthesize.
        'max_length' => 160,

        // Cap on new (uncached) syntheses per day, so a public endpoint can't drain the quota.
        'daily_new_limit' => 3000,
    ],
];
