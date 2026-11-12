<?php

namespace App\Speech;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Synthesizes speech with the Azure AI Speech REST API. */
class AzureSpeech implements SpeechSynthesizer
{
    public function __construct(
        private string $key,
        private string $region,
        private string $voice,
        private string $rate,
        private string $pitch,
    ) {}

    public static function fromConfig(): ?self
    {
        $config = config('dandan.tts.azure');

        if (empty($config['key']) || empty($config['region'])) {
            return null;
        }

        return new self($config['key'], $config['region'], $config['voice'], $config['rate'], $config['pitch']);
    }

    public function voice(): string
    {
        return $this->voice;
    }

    /** Returns MP3 bytes. */
    public function synthesize(string $text): string
    {
        $ssml = sprintf(
            '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="he-IL">'
            .'<voice name="%s"><prosody rate="%s" pitch="%s">%s</prosody></voice></speak>',
            htmlspecialchars($this->voice, ENT_XML1 | ENT_QUOTES),
            htmlspecialchars($this->rate, ENT_XML1 | ENT_QUOTES),
            htmlspecialchars($this->pitch, ENT_XML1 | ENT_QUOTES),
            htmlspecialchars($text, ENT_XML1 | ENT_QUOTES),
        );

        $response = Http::withHeaders([
            'Ocp-Apim-Subscription-Key' => $this->key,
            'X-Microsoft-OutputFormat' => 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent' => 'dandan',
        ])
            ->withBody($ssml, 'application/ssml+xml')
            ->timeout(6)
            ->post("https://{$this->region}.tts.speech.microsoft.com/cognitiveservices/v1");

        if (! $response->successful() || $response->body() === '') {
            throw new RuntimeException("Azure TTS failed with status {$response->status()}");
        }

        return $response->body();
    }
}
