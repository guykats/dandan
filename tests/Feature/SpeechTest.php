<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SpeechTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        config([
            'dandan.tts.driver' => 'azure',
            'dandan.tts.azure.key' => 'test-key',
            'dandan.tts.azure.region' => 'westeurope',
        ]);
    }

    public function test_synthesizes_once_and_serves_from_cache(): void
    {
        Http::fake(['westeurope.tts.speech.microsoft.com/*' => Http::response('MP3DATA', 200)]);

        $this->get('/tts?t='.urlencode('כמה זה 3 ועוד 4?'))
            ->assertOk()
            ->assertHeader('Content-Type', 'audio/mpeg');
        $this->get('/tts?t='.urlencode('כמה זה 3 ועוד 4?'))->assertOk();

        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => $request->hasHeader('Ocp-Apim-Subscription-Key', 'test-key')
            && str_contains($request->body(), 'he-IL-HilaNeural')
            && str_contains($request->body(), 'כמה זה 3 ועוד 4?'));
    }

    public function test_escapes_text_inside_ssml(): void
    {
        Http::fake(['*' => Http::response('MP3DATA', 200)]);

        $this->get('/tts?t='.urlencode('"שלום"'))->assertOk();

        Http::assertSent(fn ($request) => str_contains($request->body(), '&quot;שלום&quot;'));
    }

    public function test_rejects_text_that_is_not_a_short_hebrew_sentence(): void
    {
        Http::fake();

        $this->get('/tts?t='.urlencode('hello world'))->assertStatus(422);
        $this->get('/tts?t='.urlencode('<speak>שלום</speak>'))->assertStatus(422);
        $this->get('/tts?t='.urlencode(str_repeat('א', 200)))->assertStatus(422);
        $this->get('/tts')->assertStatus(422);

        Http::assertNothingSent();
    }

    public function test_returns_503_when_azure_fails(): void
    {
        Http::fake(['*' => Http::response('', 401)]);

        $this->get('/tts?t='.urlencode('שלום'))->assertStatus(503);
        Storage::disk('local')->assertDirectoryEmpty('tts');

        // While Azure is marked down, new sentences fail fast without calling it again.
        $this->get('/tts?t='.urlencode('שלום שוב'))->assertStatus(503);
        Http::assertSentCount(1);
    }

    public function test_daily_limit_on_new_sentences(): void
    {
        config(['dandan.tts.daily_new_limit' => 2]);
        Http::fake(['*' => Http::response('MP3DATA', 200)]);

        $this->get('/tts?t='.urlencode('אחת'))->assertOk();
        $this->get('/tts?t='.urlencode('שתיים'))->assertOk();
        $this->get('/tts?t='.urlencode('שלוש'))->assertStatus(429);
        // Cached sentences are still served.
        $this->get('/tts?t='.urlencode('אחת'))->assertOk();
    }

    public function test_disabled_without_azure_config(): void
    {
        config(['dandan.tts.driver' => 'browser']);

        $this->get('/tts?t='.urlencode('שלום'))->assertNotFound();
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('serverVoice', null));
    }

    public function test_pages_share_the_server_voice_when_enabled(): void
    {
        $this->get('/')->assertInertia(fn (Assert $page) => $page->where('serverVoice', 'he-IL-HilaNeural'));
    }
}
