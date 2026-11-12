<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GoogleSpeechTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config([
            'dandan.tts.driver' => 'google',
            'dandan.tts.google.key' => 'g-key',
            'dandan.tts.google.voice' => 'he-IL-Chirp3-HD-Aoede',
        ]);
    }

    public function test_synthesizes_with_google_once_and_caches(): void
    {
        Http::fake(['texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('MP3DATA')])]);

        $this->get('/tts?t='.urlencode('כמה זה 3 ועוד 4?'))
            ->assertOk()
            ->assertHeader('Content-Type', 'audio/mpeg');
        $second = $this->get('/tts?t='.urlencode('כמה זה 3 ועוד 4?'))->assertOk();
        $this->assertSame('MP3DATA', $second->getContent());

        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->hasHeader('X-Goog-Api-Key', 'g-key')
            && $request['voice']['languageCode'] === 'he-IL'
            && $request['voice']['name'] === 'he-IL-Chirp3-HD-Aoede'
            && $request['input']['text'] === 'כמה זה 3 ועוד 4?'
            && $request['audioConfig']['audioEncoding'] === 'MP3');
    }

    public function test_google_error_returns_503(): void
    {
        Http::fake(['*' => Http::response(['error' => ['message' => 'API key not valid']], 400)]);

        $this->get('/tts?t='.urlencode('שלום'))->assertStatus(503);
        Storage::disk('local')->assertDirectoryEmpty('tts');
    }

    public function test_pages_share_the_google_voice(): void
    {
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('serverVoice', 'he-IL-Chirp3-HD-Aoede'));
    }

    public function test_missing_key_disables_server_speech(): void
    {
        config(['dandan.tts.google.key' => null]);

        $this->get('/tts?t='.urlencode('שלום'))->assertNotFound();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('serverVoice', null));
    }
}
