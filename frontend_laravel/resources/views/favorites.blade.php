@extends('layouts.app')

@section('content')
<div class="max-w-7xl mx-auto space-y-6" x-data="favoritesPage('{{ session('token') }}')">
    
    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h1 class="text-2xl font-bold text-slate-800 mb-2">Dokumen Favorit</h1>
        <p class="text-slate-500">Koleksi dokumen yang Anda simpan untuk akses cepat.</p>
    </div>

    <!-- Favorites Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <template x-for="doc in favorites" :key="doc.id">
            <div class="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group h-full relative">
                
                <!-- Unfavorite Button -->
                <button @click="removeFavorite(doc.id)" class="absolute top-4 right-4 text-yellow-400 hover:text-slate-300 transition-colors z-10 bg-white rounded-full p-1 shadow-sm">
                    <svg class="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                    </svg>
                </button>

                <div class="p-5 flex-1">
                    <div class="mb-4">
                        <div class="p-2 bg-blue-50 rounded-lg text-blue-600 inline-block">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </div>
                    </div>

                    <h3 class="text-lg font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors" x-text="doc.title"></h3>
                    <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md mb-3 inline-block" x-text="doc.category"></span>
                    <p class="text-slate-500 text-sm line-clamp-3" x-text="doc.description"></p>
                </div>

                <div class="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-lg flex justify-between items-center">
                    <span class="text-xs text-slate-400" x-text="doc.date"></span>
                    <a :href="doc.url" class="text-sm font-medium text-blue-600 hover:text-blue-800">Lihat Dokumen →</a>
                </div>
            </div>
        </template>
    </div>

    <!-- Empty State -->
    <div x-show="favorites.length === 0 && !loading" class="text-center py-16 bg-white rounded-lg border border-slate-100 shadow-sm" x-cloak>
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
            <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900">Belum ada favorit</h3>
        <p class="mt-1 text-slate-500 mb-6">Tandai dokumen penting dengan ikon bintang untuk menyimpannya di sini.</p>
        <a href="{{ route('search') }}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Cari Dokumen
        </a>
    </div>

    <!-- Loading -->
    <div x-show="loading" class="flex justify-center py-12">
        <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>

</div>

<script>
    function favoritesPage(token) {
        return {
            favorites: [],
            loading: false,

            async fetchFavorites() {
                this.loading = true;
                try {
                    // TODO: Replace with actual API endpoint
                    // const res = await fetch('{{ config('services.python_api.url') }}/favorites', ...);
                    // this.favorites = await res.json();

                    // Mock data
                    await new Promise(r => setTimeout(r, 600));
                    this.favorites = [
                        { id: 101, title: 'SOP Pengelasan Pipa Gas', category: 'Prosedur', description: 'Standar operasional prosedur untuk pengelasan pipa gas tekanan tinggi.', date: '20 Jan 2024', url: '#' },
                        { id: 102, title: 'Manual K3 Lapangan', category: 'Manual', description: 'Panduan lengkap keselamatan dan kesehatan kerja di lapangan.', date: '15 Jan 2024', url: '#' },
                    ];
                } catch (err) {
                    console.error('Failed to fetch favorites', err);
                } finally {
                    this.loading = false;
                }
            },

            async removeFavorite(id) {
                if(!confirm('Hapus dari favorit?')) return;
                
                // Optimistic update
                this.favorites = this.favorites.filter(doc => doc.id !== id);
                
                // TODO: API Call
                // await fetch(...)
            },

            init() {
                this.fetchFavorites();
            }
        }
    }
</script>
@endsection
