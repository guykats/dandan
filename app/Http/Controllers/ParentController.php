<?php

namespace App\Http\Controllers;

use App\Game\Curriculum;
use App\Game\GameService;
use App\Models\Attempt;
use App\Models\KidProfile;
use App\Models\Round;
use App\Models\StationProgress;
use App\Speech\Speech;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;

class ParentController extends Controller
{
    private const SESSION_KEY = 'parent_unlocked_until';

    public static function isUnlocked(Request $request): bool
    {
        $until = $request->session()->get(self::SESSION_KEY);

        return $until && now()->timestamp < $until;
    }

    public function show(): Response
    {
        $profile = KidProfile::current();
        $finished = Round::query()->finished();
        $attempts = Attempt::query()->whereHas('round', fn ($q) => $q->finished());

        $bySkill = (clone $attempts)
            ->select('skill', DB::raw('COUNT(*) as total'), DB::raw('SUM(CASE WHEN correct_first_try THEN 1 ELSE 0 END) as correct'))
            ->groupBy('skill')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->skill => [
                'total' => (int) $row->total,
                'correct' => (int) $row->correct,
            ]]);

        $toughest = (clone $attempts)
            ->select('label', DB::raw('COUNT(*) as seen'), DB::raw('SUM(mistakes) as mistakes'))
            ->where('mistakes', '>', 0)
            ->whereNotNull('label')
            ->groupBy('label')
            ->orderByDesc('mistakes')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'seen' => (int) $row->seen,
                'mistakes' => (int) $row->mistakes,
            ]);

        $journey = app(GameService::class)->journey();
        $passed = collect($journey['stations'])->where('bestStars', '>=', 1);

        $recentRounds = (clone $finished)
            ->latest('finished_at')
            ->latest('id')
            ->limit(15)
            ->get(['id', 'station', 'size', 'correct_first_try', 'finished_at'])
            ->reverse()
            ->values()
            ->map(fn (Round $r) => [
                'id' => $r->id,
                'station' => $r->station,
                'stationTitle' => Curriculum::find($r->station)['title'] ?? '',
                'size' => $r->size,
                'correct' => $r->correct_first_try,
                'finishedAt' => $r->finished_at->toIso8601String(),
            ]);

        return Inertia::render('Parent', [
            'profile' => [
                'stars' => $profile->stars,
                'stickers' => $profile->stickersUnlocked(),
            ],
            'journey' => [
                'current' => $journey['current'],
                'currentTitle' => Curriculum::find($journey['current'])['title'],
                'passed' => $passed->count(),
                'stationStars' => $passed->sum('bestStars'),
                'total' => Curriculum::count(),
                'stations' => collect($journey['stations'])->map(fn ($s) => ['id' => $s['id'], 'title' => $s['title'], 'world' => $s['world']])->all(),
            ],
            'worlds' => Curriculum::WORLDS,
            'stats' => [
                'rounds' => (clone $finished)->count(),
                'bySkill' => $bySkill,
                'toughest' => $toughest,
                'recentRounds' => $recentRounds,
            ],
            'unlockMinutes' => (int) config('dandan.parent_unlock_minutes'),
            'voiceLab' => ($tts = Speech::fromConfig()) ? [
                'voices' => $tts->availableVoices(),
                'defaultVoice' => $tts->voice(),
                'defaultMode' => config('dandan.tts.numbers'),
                'rates' => config('dandan.tts.rates'),
                'defaultRate' => (float) config('dandan.tts.rate'),
                'defaultVocalize' => (bool) config('dandan.tts.vocalize'),
            ] : null,
        ]);
    }

    public function unlock(Request $request): RedirectResponse
    {
        $request->validate(['pin' => ['required', 'string', 'max:12']]);

        $key = 'parent-pin:'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            return back()->withErrors(['pin' => "יותר מדי ניסיונות. נסו שוב בעוד {$seconds} שניות"]);
        }

        $pin = (string) config('dandan.parent_pin');
        if ($pin === '') {
            return back()->withErrors(['pin' => 'לא הוגדר קוד הורה בשרת (PARENT_PIN)']);
        }

        if (! hash_equals($pin, (string) $request->input('pin'))) {
            RateLimiter::hit($key, 60);

            return back()->withErrors(['pin' => 'הקוד לא נכון']);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();
        $request->session()->put(
            self::SESSION_KEY,
            now()->addMinutes((int) config('dandan.parent_unlock_minutes'))->timestamp,
        );

        return redirect()->route('parent');
    }

    public function lock(Request $request): RedirectResponse
    {
        $request->session()->forget(self::SESSION_KEY);

        return redirect()->route('home');
    }

    public function unlockTo(Request $request, GameService $game): RedirectResponse
    {
        $validated = $request->validate([
            'station' => ['required', 'integer', 'min:1', 'max:'.Curriculum::count()],
        ]);

        $game->unlockUpTo((int) $validated['station']);

        return back();
    }

    public function reset(): RedirectResponse
    {
        DB::transaction(function () {
            Attempt::query()->delete();
            Round::query()->delete();
            StationProgress::query()->delete();
            KidProfile::query()->delete();
        });

        return back();
    }
}
