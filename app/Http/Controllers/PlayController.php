<?php

namespace App\Http\Controllers;

use App\Game\Curriculum;
use App\Game\GameService;
use App\Models\Round;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayController extends Controller
{
    public function __construct(private GameService $game) {}

    /** "Play" without a station continues the journey where the child left off. */
    public function continue(): RedirectResponse
    {
        return redirect()->route('play', ['station' => $this->game->journey()['current']]);
    }

    public function show(int $station): Response|RedirectResponse
    {
        $definition = Curriculum::find($station);
        if ($definition === null || ! $this->game->isUnlocked($station)) {
            return redirect()->route('journey');
        }

        ['round' => $round, 'questions' => $questions] = $this->game->startRound($station);

        return Inertia::render('Play', [
            'roundId' => $round->id,
            'station' => [
                'id' => $definition['id'],
                'title' => $definition['title'],
                'world' => $definition['world'],
                'boss' => $definition['boss'],
                'visual' => $definition['visual'],
            ],
            'worlds' => Curriculum::WORLDS,
            'questions' => $questions,
        ]);
    }

    public function finish(Request $request, Round $round): JsonResponse
    {
        abort_if($round->isFinished(), 409, 'Round already finished');

        $validated = $request->validate([
            'results' => ['required', 'array', 'size:'.$round->size],
            'results.*.first_choice' => ['required', 'integer', 'min:0', 'max:100'],
            'results.*.mistakes' => ['required', 'integer', 'min:0', 'max:50'],
        ]);

        return response()->json($this->game->finishRound($round, array_values($validated['results'])));
    }
}
