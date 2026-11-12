<?php

namespace App\Http\Middleware;

use App\Models\KidProfile;
use App\Speech\Speech;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'kid' => fn () => $this->kid(),
            'starsPerSticker' => (int) config('dandan.stars_per_sticker'),
            // Name of the server voice when server-side speech is configured, otherwise null.
            'serverVoice' => Speech::fromConfig()?->voice(),
        ];
    }

    /**
     * @return array{stars: int, stickers: int}
     */
    private function kid(): array
    {
        $profile = KidProfile::current();

        return [
            'stars' => $profile->stars,
            'stickers' => $profile->stickersUnlocked(),
        ];
    }
}
