<?php

namespace App\Speech;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Synthesizes speech with the Google Cloud Text-to-Speech REST API (API key auth). */
class GoogleSpeech implements SpeechSynthesizer
{
    public function __construct(
        private string $key,
        private string $voice,
        private float $rate,
    ) {}

    public static function fromConfig(): ?self
    {
        $config = config('dandan.tts.google');

        if (empty($config['key'])) {
            return null;
        }

        return new self($config['key'], $config['voice'], (float) $config['rate']);
    }

    public function voice(): string
    {
        return $this->voice;
    }

    public function synthesize(string $text): string
    {
        // The language code is the voice name's prefix, e.g. "he-IL" in "he-IL-Chirp3-HD-Aoede".
        $languageCode = implode('-', array_slice(explode('-', $this->voice), 0, 2));

        $response = Http::withHeaders(['X-Goog-Api-Key' => $this->key])
            ->timeout(6)
            ->post('https://texttospeech.googleapis.com/v1/text:synthesize', [
                'input' => ['text' => $text],
                'voice' => ['languageCode' => $languageCode, 'name' => $this->voice],
                'audioConfig' => ['audioEncoding' => 'MP3', 'speakingRate' => $this->rate],
            ]);

        $audio = $response->successful() ? base64_decode((string) $response->json('audioContent'), true) : false;

        if (! $audio) {
            $message = $response->json('error.message') ?? 'empty audio';
            throw new RuntimeException("Google TTS failed with status {$response->status()}: {$message}");
        }

        return $audio;
    }
}
