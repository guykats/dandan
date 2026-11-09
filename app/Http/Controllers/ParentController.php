<?php

namespace App\Http\Controllers;

use App\Models\Attempt;
use App\Models\KidProfile;
use App\Models\Round;
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

        $byOperation = (clone $attempts)
            ->select('operation', DB::raw('COUNT(*) as total'), DB::raw('SUM(CASE WHEN correct_first_try THEN 1 ELSE 0 END) as correct'))
            ->groupBy('operation')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->operation => [
                'total' => (int) $row->total,
                'correct' => (int) $row->correct,
            ]]);

        $toughest = (clone $attempts)
            ->select('operation', 'a', 'b', DB::raw('COUNT(*) as seen'), DB::raw('SUM(mistakes) as mistakes'))
            ->where('mistakes', '>', 0)
            ->groupBy('operation', 'a', 'b')
            ->orderByDesc('mistakes')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'label' => "{$row->a} {$row->operation} {$row->b}",
                'seen' => (int) $row->seen,
                'mistakes' => (int) $row->mistakes,
            ]);

        $recentRounds = (clone $finished)
            ->latest('finished_at')
            ->latest('id')
            ->limit(15)
            ->get(['id', 'level', 'size', 'correct_first_try', 'finished_at'])
            ->reverse()
            ->values()
            ->map(fn (Round $r) => [
                'id' => $r->id,
                'level' => $r->level,
                'size' => $r->size,
                'correct' => $r->correct_first_try,
                'finishedAt' => $r->finished_at->toIso8601String(),
            ]);

        return Inertia::render('Parent', [
            'profile' => [
                'level' => $profile->level,
                'stars' => $profile->stars,
                'stickers' => $profile->stickersUnlocked(),
            ],
            'stats' => [
                'rounds' => (clone $finished)->count(),
                'byOperation' => $byOperation,
                'toughest' => $toughest,
                'recentRounds' => $recentRounds,
            ],
            'unlockMinutes' => (int) config('dandan.parent_unlock_minutes'),
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

    public function setLevel(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'level' => ['required', 'integer', 'in:'.implode(',', config('dandan.levels'))],
        ]);

        $profile = KidProfile::current();
        $profile->setLevel((int) $validated['level']);
        $profile->save();

        return back();
    }

    public function reset(): RedirectResponse
    {
        DB::transaction(function () {
            Attempt::query()->delete();
            Round::query()->delete();
            KidProfile::query()->delete();
        });

        return back();
    }
}
