<?php

namespace App\Http\Controllers;

use App\Game\Curriculum;
use App\Game\GameService;
use App\Models\KidProfile;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __construct(private GameService $game) {}

    public function index(): Response
    {
        $current = $this->game->journey()['current'];
        $station = Curriculum::find($current);

        return Inertia::render('Home', [
            'current' => [
                'id' => $current,
                'title' => $station['title'],
                'world' => $station['world'],
            ],
        ]);
    }

    public function journey(): Response
    {
        return Inertia::render('Journey', [
            ...$this->game->journey(),
            'worlds' => Curriculum::WORLDS,
            'perWorld' => Curriculum::STATIONS_PER_WORLD,
        ]);
    }

    public function stickers(): Response
    {
        return Inertia::render('Stickers', [
            'unlocked' => KidProfile::current()->stickersUnlocked(),
        ]);
    }
}
