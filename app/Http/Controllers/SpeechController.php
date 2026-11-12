<?php

namespace App\Http\Controllers;

use App\Speech\HebrewNumbers;
use App\Speech\Speech;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class SpeechController extends Controller
{
    public function show(Request $request): Response
    {
        $tts = Speech::fromConfig();
        abort_if($tts === null, 404);

        $text = trim((string) $request->query('t', ''));
        $max = (int) config('dandan.tts.max_length');

        // Only short Hebrew game sentences: Hebrew letters, digits, spaces, basic punctuation and math signs.
        abort_unless($text !== '' && mb_strlen($text) <= $max && preg_match('/^[\x{0590}-\x{05FF}\x{2014}0-9\s.,!?:\-+=׳״"\'()]+$/u', $text), 422);

        // v2: numbers are spelled out as vocalized Hebrew words before synthesis.
        $path = 'tts/'.$tts->voice().'/v2/'.sha1($text).'.mp3';
        $disk = Storage::disk('local');

        if (! $disk->exists($path)) {
            // After a failure, skip Azure for a few minutes so the browser falls back to its own voice right away.
            abort_if(Cache::has('tts-down'), 503);

            $key = 'tts-new:'.now()->toDateString();
            Cache::add($key, 0, now()->addDay());
            if (Cache::increment($key) > (int) config('dandan.tts.daily_new_limit')) {
                abort(429);
            }

            try {
                $disk->put($path, $tts->synthesize(HebrewNumbers::spell($text)));
            } catch (Throwable $e) {
                Log::warning('TTS synthesis failed', ['error' => $e->getMessage()]);
                Cache::put('tts-down', true, now()->addMinutes(5));
                abort(503);
            }
        }

        return response($disk->get($path), 200, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
