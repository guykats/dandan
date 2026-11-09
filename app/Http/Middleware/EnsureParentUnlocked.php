<?php

namespace App\Http\Middleware;

use App\Http\Controllers\ParentController;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureParentUnlocked
{
    public function handle(Request $request, Closure $next): Response
    {
        if (ParentController::isUnlocked($request)) {
            return $next($request);
        }

        if (! $request->isMethod('GET')) {
            abort(403);
        }

        return Inertia::render('ParentGate')->toResponse($request);
    }
}
