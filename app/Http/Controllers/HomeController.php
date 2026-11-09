<?php

namespace App\Http\Controllers;

use App\Models\KidProfile;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Home');
    }

    public function stickers(): Response
    {
        return Inertia::render('Stickers', [
            'unlocked' => KidProfile::current()->stickersUnlocked(),
        ]);
    }
}
