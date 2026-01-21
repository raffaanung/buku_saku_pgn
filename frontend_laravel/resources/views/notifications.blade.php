@extends('layouts.app')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100">
        <h2 class="text-xl font-bold text-slate-800">Notifikasi</h2>
        <p class="text-slate-500 text-sm mt-1">Pemberitahuan terbaru tentang aktivitas dokumen.</p>
    </div>

    <div class="p-6 text-center text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p>Belum ada notifikasi baru saat ini.</p>
    </div>
</div>
@endsection
