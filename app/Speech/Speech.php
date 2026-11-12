<?php

namespace App\Speech;

/** Picks the configured server-side speech provider, or null when speech is left to the browser. */
class Speech
{
    public static function fromConfig(): ?SpeechSynthesizer
    {
        return match (config('dandan.tts.driver')) {
            'google' => GoogleSpeech::fromConfig(),
            'azure' => AzureSpeech::fromConfig(),
            default => null,
        };
    }
}
