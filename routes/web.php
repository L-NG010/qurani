<?php

use App\Http\Controllers\LinkID\RecapController;
use App\Http\Controllers\LinkID\ResultController;
use App\Http\Controllers\LinkID\SettingsController;
use App\Http\Controllers\Qurani\ChapterController;
use App\Http\Controllers\Qurani\DashboardController;
use App\Http\Controllers\Qurani\HomeController;
use App\Http\Controllers\Qurani\JuzController;
use App\Http\Controllers\Qurani\PageController;
use App\Http\Controllers\Qurani\AppLoadController;
use App\Http\Controllers\SetoranController; // Tambahkan use untuk SetoranController
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

Route::get('/', AppLoadController::class);
Route::get('/home', [HomeController::class, 'index'])->name('home');

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

// Ubah rute lama '/result' menjadi lebih spesifik
Route::get('/result/index', [ResultController::class, 'index'])->name('result.index');
// Tambahkan rute baru dengan parameter {id}
Route::get('/result/{id}', [SetoranController::class, 'showResult'])->name('result');
Route::get('/result/page', [ResultController::class, 'page'])->name('result.page');

Route::get('/recap', function () {
    return Inertia::render('recap/index');
})->name('recap');
Route::get('/filter', function () {
    return Inertia::render('dashboard/recap');
})->name('filter');

Route::get('/surah/{surah}', [ChapterController::class, 'show'])->name('surah');
Route::get('/juz/{juz}', [JuzController::class, 'show'])->name('juz');
Route::get('/page/{page}', [PageController::class, 'show'])->name('page');

Route::get('/redirect', function () {
    return Inertia::render('redirect');
})->name('redirect');

Route::post('/set-cookie', function (Request $request) {
    $u_id = $request->input('u_id');

    Cookie::queue('u_id', $u_id, 60);

    Log::info($u_id);

    return redirect()->back();
})->name('set.cookie');

Route::get('/setoran/{id}', [HomeController::class, 'getSetoranById'])->name('setoran.show');
Route::get('/recap', [HomeController::class, 'recap'])->name('recap');
Route::get('/recap/surah/{id}', [RecapController::class, 'index'])->name('recap.surah');
Route::get('/recap/page/{id}', [RecapController::class, 'page'])->name('recap.page');
Route::post('/setoran/{id}/sign', [HomeController::class, 'updateSignature']);