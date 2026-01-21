@extends('layouts.app')

@section('content')
<div class="max-w-5xl mx-auto space-y-6">
    
    <!-- Welcome Card -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 class="text-2xl font-bold text-slate-800 mb-2">
            Selamat Datang, {{ session('user')['name'] }}
        </h2>
        <p class="text-slate-500">
            Berikut adalah daftar dokumen yang tersedia. Gunakan fitur pencarian untuk menemukan dokumen spesifik menggunakan bahasa sehari-hari.
        </p>
    </div>

    <!-- Search Section -->
    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-100" 
         x-data="searchComponent('{{ session('token') }}')">
        <div class="text-lg font-semibold mb-4 text-slate-700">Daftar Dokumen</div>
        
        <div class="space-y-3">
            <form @submit.prevent="performSearch" class="flex gap-2">
                <div class="relative flex-1">
                    <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        x-model="q"
                        type="text"
                        class="w-full border border-slate-300 rounded px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Cari dokumen, misal: bagaimana cara pengelasan pipa..."
                    />
                </div>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" :disabled="loading">
                    <span x-show="!loading">Cari</span>
                    <span x-show="loading">...</span>
                </button>
            </form>

            <div x-show="error" class="text-sm text-red-600" x-text="error"></div>

            <!-- Results List -->
            <div class="grid gap-3 mt-4">
                <template x-for="r in results" :key="r.id">
                    <div class="relative p-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all hover:shadow-md group">
                        
                        <a :href="r.file_url ? (r.file_url.startsWith('http') ? r.file_url : '{{ config('services.python_api.url') }}' + r.file_url) : '#'" target="_blank" class="block">
                            <div class="flex items-start justify-between">
                                <div class="flex items-start gap-3">
                                    <div class="bg-blue-50 text-blue-600 p-2 rounded shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-blue-600 group-hover:underline text-lg" x-text="r.title"></h3>
                                        <p class="text-sm text-slate-500 mt-1" x-text="r.uploader?.name ? 'Diunggah oleh: ' + r.uploader.name + ' (' + r.uploader.instansi + ')' : 'Diunggah oleh: Unknown'"></p>
                                        <div class="flex gap-2 mt-2">
                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                                <span x-text="formatDate(r.created_at)"></span>
                                            </span>
                                            <template x-if="r.category">
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" x-text="r.category"></span>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </template>
                
                <div x-show="results.length === 0 && !loading" class="text-slate-500 text-sm text-center py-8 bg-slate-50 rounded border border-dashed border-slate-200">
                    <span x-show="!q">Belum ada dokumen yang diunggah.</span>
                    <span x-show="q">Tidak ada dokumen yang ditemukan untuk pencarian ini.</span>
                </div>
            </div>
        </div>
    </div>

</div>

<script>
    function searchComponent(token) {
        return {
            q: '',
            loading: false,
            results: [],
            error: '',
            
            init() {
                this.performSearch();
            },
            
            formatDate(dateString) {
                if (!dateString) return '';
                return new Date(dateString).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
            },
            
            async performSearch() {
                this.loading = true;
                this.error = '';
                
                try {
                    // Use list endpoint which supports optional q param
                    const url = `{{ config('services.python_api.url') }}/documents/?q=${encodeURIComponent(this.q)}`;
                    
                    const response = await fetch(url, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        }
                    });
                    
                    if (!response.ok) throw new Error('Gagal mengambil data');
                    
                    const data = await response.json();
                    this.results = data.results || [];
                } catch (err) {
                    this.error = 'Terjadi kesalahan saat memuat data.';
                    console.error(err);
                } finally {
                    this.loading = false;
                }
            }
        }
    }
</script>
@endsection
