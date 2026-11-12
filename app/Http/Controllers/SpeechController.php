<?php

namespace App\Http\Controllers;

use App\Speech\HebrewLexicon;
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

        // Optional overrides used by the voice lab in the parent area.
        $mode = (string) $request->query('m', config('dandan.tts.numbers'));
        $voice = (string) $request->query('v', $tts->voice());
        $vocalize = (bool) (int) $request->query('w', config('dandan.tts.vocalize') ? '1' : '0');
        $rate = (float) $request->query('r', config('dandan.tts.rate'));
        $allowedRates = array_map('floatval', [...config('dandan.tts.rates'), config('dandan.tts.rate')]);
        abort_unless(
            in_array($mode, HebrewNumbers::MODES, true)
            && in_array($voice, $tts->availableVoices(), true)
            && in_array($rate, $allowedRates, true),
            422,
        );

        $path = "tts/{$voice}/{$mode}".($vocalize ? '-w' : '').'/r'.number_format($rate, 2).'/'.sha1($text).'.mp3';
        $disk = Storage::disk('local');

        if (! $disk->exists($path)) {
            // After a failure, skip this voice for a few minutes so the browser falls back to its own voice right away.
            $downKey = "tts-down:{$voice}";
            abort_if(Cache::has($downKey), 503);

            $key = 'tts-new:'.now()->toDateString();
            Cache::add($key, 0, now()->addDay());
            if (Cache::increment($key) > (int) config('dandan.tts.daily_new_limit')) {
                abort(429);
            }

            try {
                $disk->put($path, $tts->synthesize($this->prepare($text, $mode, $vocalize), $voice, $rate));
            } catch (Throwable $e) {
                Log::warning('TTS synthesis failed', ['voice' => $voice, 'error' => $e->getMessage()]);
                Cache::put($downKey, true, now()->addMinutes(5));
                abort(503);
            }
        }

        return response($disk->get($path), 200, [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }

    /** Text as sent to the engine: vowel marks on known words, numbers spelled out per mode. */
    private function prepare(string $text, string $mode, bool $vocalize): string
    {
        if ($vocalize) {
            $text = HebrewLexicon::vocalize($text);
        }

        return HebrewNumbers::spell($text, $mode);
    }
}
