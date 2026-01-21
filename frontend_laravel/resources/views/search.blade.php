@extends('layouts.app')

@section('content')
<div class="max-w-7xl mx-auto space-y-6" x-data="searchPage('{{ session('token') }}')">
    
    <!-- Search Header -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h1 class="text-2xl font-bold text-slate-800 mb-4">Pencarian Dokumen</h1>
        
        <form @submit.prevent="performSearch" class="flex flex-col md:flex-row gap-4">
            <div class="flex-1 relative">
                <input
                    x-model="q"
                    type="text"
                    class="w-full border border-slate-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    placeholder="Cari judul, kategori, atau tag..."
                />
                <svg class="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </div>
            
            <button type="submit" 
                    class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70" 
                    :disabled="loading">
                <span x-show="!loading">Cari</span>
                <span x-show="loading" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            </button>
        </form>

        <!-- Filters (Optional placeholder for future expansion) -->
        <div class="mt-4 flex flex-wrap gap-2">
            <template x-for="filter in filters" :key="filter">
                <button class="px-3 py-1 text-sm bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                    <span x-text="filter"></span>
                </button>
            </template>
        </div>
    </div>

    <!-- Results Section -->
    <div class="space-y-4">
        <!-- Loading State -->
        <div x-show="loading" class="flex justify-center py-12">
            <div class="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>

        <!-- Error State -->
        <div x-show="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm" x-cloak>
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-700" x-text="error"></p>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div x-show="!loading && searched && results.length === 0" class="text-center py-16 bg-white rounded-lg border border-slate-100 shadow-sm" x-cloak>
            <svg class="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-slate-900">Tidak ada dokumen ditemukan</h3>
            <p class="mt-1 text-sm text-slate-500">Coba kata kunci lain atau periksa ejaan Anda.</p>
        </div>

        <!-- Results Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" x-show="results.length > 0" x-cloak>
            <template x-for="doc in results" :key="doc.id">
                <div class="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group h-full">
                    <div class="p-5 flex-1">
                        <div class="flex justify-between items-start mb-4">
                            <!-- File Icon -->
                            <div class="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                            <!-- Favorite Toggle -->
                            <button @click="toggleFavorite(doc)" class="text-slate-300 hover:text-yellow-400 transition-colors focus:outline-none">
                                <svg class="w-6 h-6" :class="doc.is_favorite ? 'text-yellow-400 fill-current' : 'fill-none'" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                                </svg>
                            </button>
                        </div>

                        <h3 class="text-lg font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors" x-text="doc.title"></h3>
                        
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span class="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md" x-text="doc.category || 'Umum'"></span>
                            <span class="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100" x-show="doc.status === 'approved'">Verified</span>
                        </div>

                        <p class="text-slate-500 text-sm line-clamp-3" x-text="doc.description || 'Tidak ada deskripsi.'"></p>
                    </div>

                    <div class="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-lg flex justify-between items-center">
                        <span class="text-xs text-slate-400" x-text="formatDate(doc.created_at)"></span>
                        <div class="flex gap-2">
                            <a :href="doc.file_url" target="_blank" class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="Preview">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </a>
                            <a :href="doc.download_url || doc.file_url" download class="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-all" title="Download">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</div>

<script>
    function searchPage(token) {
        return {
            q: '',
            loading: false,
            searched: false,
            results: [],
            error: '',
            filters: ['Prosedur', 'Instruksi Kerja', 'Manual', 'Formulir'], // Static for now
            
            async performSearch() {
                if (!this.q.trim()) return;
                
                this.loading = true;
                this.error = '';
                this.searched = true;
                
                try {
                    // Using the same endpoint as dashboard
                    const response = await fetch(`http://localhost:8000/documents/search?q=${encodeURIComponent(this.q)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) throw new Error('Gagal mengambil data pencarian');
                    
                    const data = await response.json();
                    // Enhance data with local state for favorites if not provided by backend
                    this.results = (data.results || []).map(doc => ({
                        ...doc,
                        is_favorite: doc.is_favorite || false // Default to false if not from DB
                    }));
                } catch (err) {
                    console.error(err);
                    this.error = 'Terjadi kesalahan koneksi. Silakan coba lagi.';
                } finally {
                    this.loading = false;
                }
            },

            async toggleFavorite(doc) {
                // Optimistic UI update
                doc.is_favorite = !doc.is_favorite;
                
                try {
                    // TODO: Implement actual API call when backend is ready
                    // const method = doc.is_favorite ? 'POST' : 'DELETE';
                    // await fetch(`http://localhost:8000/favorites/${doc.id}`, { ... });
                    console.log('Toggled favorite for:', doc.id, doc.is_favorite);
                } catch (err) {
                    // Revert on error
                    doc.is_favorite = !doc.is_favorite;
                    console.error('Failed to toggle favorite');
                }
            },

            formatDate(dateString) {
                if (!dateString) return '';
                const date = new Date(dateString);
                return new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }).format(date);
            },

            init() {
                // If query param exists, auto search
                const urlParams = new URLSearchParams(window.location.search);
                const query = urlParams.get('q');
                if (query) {
                    this.q = query;
                    this.performSearch();
                }
            }
        }
    }
</script>
@endsection
