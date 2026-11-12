<?php

use App\Http\Controllers\DeployWebhookController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ParentController;
use App\Http\Controllers\PlayController;
use App\Http\Controllers\SpeechController;
use Illuminate\Support\Facades\Route;

Route::post('/deploy-webhook', [DeployWebhookController::class, 'handle'])->name('deploy-webhook');

Route::get('/tts', [SpeechController::class, 'show'])->middleware('throttle:120,1')->name('tts');

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/journey', [HomeController::class, 'journey'])->name('journey');
Route::get('/stickers', [HomeController::class, 'stickers'])->name('stickers');

Route::get('/play', [PlayController::class, 'continue'])->name('play.continue');
Route::get('/play/{station}', [PlayController::class, 'show'])->whereNumber('station')->name('play');
Route::post('/rounds/{round}/finish', [PlayController::class, 'finish'])->name('rounds.finish');

Route::post('/parent/unlock', [ParentController::class, 'unlock'])->name('parent.unlock');
Route::middleware('parent.unlocked')->group(function () {
    Route::get('/parent', [ParentController::class, 'show'])->name('parent');
    Route::post('/parent/lock', [ParentController::class, 'lock'])->name('parent.lock');
    Route::post('/parent/unlock-to', [ParentController::class, 'unlockTo'])->name('parent.unlock-to');
    Route::post('/parent/reset', [ParentController::class, 'reset'])->name('parent.reset');
});
