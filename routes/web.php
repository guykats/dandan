<?php

use App\Http\Controllers\DeployWebhookController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\PlayController;
use Illuminate\Support\Facades\Route;

Route::post('/deploy-webhook', [DeployWebhookController::class, 'handle'])->name('deploy-webhook');

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/stickers', [HomeController::class, 'stickers'])->name('stickers');

Route::get('/play', [PlayController::class, 'show'])->name('play');
Route::post('/rounds/{round}/finish', [PlayController::class, 'finish'])->name('rounds.finish');

Route::post('/parent/unlock', [ParentController::class, 'unlock'])->name('parent.unlock');
Route::middleware('parent.unlocked')->group(function () {
    Route::get('/parent', [ParentController::class, 'show'])->name('parent');
    Route::post('/parent/lock', [ParentController::class, 'lock'])->name('parent.lock');
    Route::post('/parent/level', [ParentController::class, 'setLevel'])->name('parent.level');
    Route::post('/parent/reset', [ParentController::class, 'reset'])->name('parent.reset');
});
