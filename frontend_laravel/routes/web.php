<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->name('register.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['web'])->group(function () {
    Route::get('/dashboard', function () {
        if (!session('user')) return redirect()->route('login');
        return view('dashboard');
    })->name('dashboard');

    Route::prefix('dashboard')->group(function () {
        Route::get('/search', function () {
            if (!session('user')) return redirect()->route('login');
            return view('search'); 
        })->name('search');

        Route::get('/check', function () {
            if (!session('user')) return redirect()->route('login');
            // Check if admin
            if (!in_array(session('user')['role'], ['admin', 'manager', 'superuser'])) {
                return redirect()->route('dashboard');
            }
            return view('check_file'); 
        })->name('check_file');

        Route::get('/delete-file', function () {
            if (!session('user')) return redirect()->route('login');
            if (!in_array(session('user')['role'], ['admin', 'manager', 'superuser'])) {
                return redirect()->route('dashboard');
            }
            return view('delete_file'); 
        })->name('delete_file');

        Route::get('/upload', function () {
            if (!session('user')) return redirect()->route('login');
            return view('upload'); 
        })->name('upload');

        Route::get('/history', function () {
            if (!session('user')) return redirect()->route('login');
            return view('history'); 
        })->name('history');

        Route::get('/notifications', function () {
            if (!session('user')) return redirect()->route('login');
            return view('notifications'); 
        })->name('notifications');
        
        Route::get('/favorites', function () {
            if (!session('user')) return redirect()->route('login');
            return view('favorites'); 
        })->name('favorites');
    });
});
