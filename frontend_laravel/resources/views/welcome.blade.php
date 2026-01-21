<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Buku Saku PGN</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-slate-50 flex items-center justify-center min-h-screen">
    <div class="max-w-lg w-full bg-white rounded-xl shadow-xl p-10 text-center border border-slate-100">
        <div class="mb-8 flex justify-center">
            <!-- Logo / Icon -->
             <div class="h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                BS
             </div>
        </div>
        
        <h1 class="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Buku Saku PGN</h1>
        <p class="text-slate-500 mb-8 leading-relaxed">
            Platform digital terpadu untuk akses cepat dokumen, panduan teknis, dan standar operasional prosedur.
        </p>
        
        @if (Route::has('login'))
            <div class="space-y-4">
                @auth
                    <a href="{{ url('/dashboard') }}" class="block w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Buka Dashboard
                    </a>
                @else
                    <a href="{{ route('login') }}" class="block w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        Masuk ke Aplikasi
                    </a>
                    
                    @if (Route::has('register'))
                        <div class="pt-4 mt-4 border-t border-slate-100">
                            <p class="text-sm text-slate-500 mb-3">Belum memiliki akun?</p>
                            <a href="{{ route('register') }}" class="inline-block px-6 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-full text-sm font-medium transition-colors">
                                Daftar Sekarang
                            </a>
                        </div>
                    @endif
                @endauth
            </div>
        @endif
        
        <div class="mt-10 text-xs text-slate-400">
            &copy; {{ date('Y') }} Perusahaan Gas Negara. All rights reserved. (v1.0)
        </div>
    </div>
</body>
</html>