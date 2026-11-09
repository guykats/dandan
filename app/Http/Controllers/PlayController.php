<?php

namespace App\Http\Controllers;

use App\Game\GameService;
use App\Models\KidProfile;
use App\Models\Round;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayController extends Controller
{
    public function __construct(private GameService $game) {}

    public function show(): Response
    {
        $profile = KidProfile::current();
        ['round' => $round, 'questions' => $questions] = $this->game->startRound($profile);

        return Inertia::render('Play', [
            'roundId' => $round->id,
            'level' => $round->level,
            'questions' => $questions,
        ]);
    }

    public function finish(Request $request, Round $round): JsonResponse
    {
        abort_if($round->isFinished(), 409, 'Round already finished');

        $validated = $request->validate([
            'results' => ['required', 'array', 'size:'.$round->size],
            'results.*.first_choice' => ['required', 'integer', 'min:0', 'max:40'],
            'results.*.mistakes' => ['required', 'integer', 'min:0', 'max:50'],
        ]);

        return response()->json($this->game->finishRound($round, array_values($validated['results'])));
    }
}
