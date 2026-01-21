@extends('layouts.app')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden" x-data="deleteFileComponent('{{ session('token') }}')">
    <div class="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
            <h2 class="text-xl font-bold text-slate-800">Hapus File</h2>
            <p class="text-slate-500 text-sm mt-1">Kelola dan hapus file yang sudah tidak diperlukan.</p>
        </div>
        <!-- Filter could be added here if needed -->
    </div>

    <!-- Loading State -->
    <div x-show="loading" class="p-6 text-center text-slate-500">
        <svg class="animate-spin h-5 w-5 mx-auto text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="mt-2 block">Memuat data...</span>
    </div>

    <!-- Error State -->
    <div x-show="error" class="p-4 m-6 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100" x-text="error" style="display: none;"></div>

    <!-- Empty State -->
    <div x-show="!loading && !error && rows.length === 0" class="p-6 text-center text-slate-500" style="display: none;">
        Tidak ada dokumen yang ditemukan.
    </div>

    <!-- Table -->
    <div x-show="!loading && rows.length > 0" class="overflow-x-auto" style="display: none;">
        <table class="w-full text-left text-sm text-slate-600 min-w-[800px]">
            <thead class="bg-slate-50 text-slate-700 uppercase font-medium">
                <tr>
                    <th class="px-6 py-3">Dokumen</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">Tanggal Upload</th>
                    <th class="px-6 py-3 text-right">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                <template x-for="row in rows" :key="row.id">
                    <tr class="hover:bg-slate-50 transition-colors group">
                        <td class="px-6 py-4">
                            <div class="flex items-start gap-3">
                                <div class="bg-red-50 text-red-600 p-2 rounded shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <div class="font-medium text-slate-800" x-text="row.title"></div>
                                    <div class="text-xs text-slate-400 mt-0.5" x-text="row.uploader?.name || 'Unknown'"></div>
                                    <a :href="row.file_url.startsWith('http') ? row.file_url : `{{ config('services.python_api.url') }}${row.file_url}`" target="_blank" class="text-xs text-blue-600 hover:underline mt-1 inline-block">Lihat File</a>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <span 
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                                :class="{
                                    'bg-yellow-100 text-yellow-800': row.status === 'pending',
                                    'bg-green-100 text-green-800': row.status === 'approved',
                                    'bg-red-100 text-red-800': row.status === 'rejected'
                                }">
                                <span class="w-1.5 h-1.5 mr-1.5 rounded-full" :class="{
                                    'bg-yellow-400': row.status === 'pending',
                                    'bg-green-400': row.status === 'approved',
                                    'bg-red-400': row.status === 'rejected'
                                }"></span>
                                <span x-text="row.status"></span>
                            </span>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-slate-600" x-text="formatDate(row.created_at)"></div>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button 
                                @click="deleteFile(row.id, row.title)"
                                class="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 hover:text-red-700 transition-colors text-xs font-medium border border-red-200"
                                :disabled="actionLoading === row.id">
                                <span x-show="actionLoading !== row.id">Hapus File</span>
                                <span x-show="actionLoading === row.id">Memproses...</span>
                            </button>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>
</div>

<script>
    function deleteFileComponent(token) {
        return {
            rows: [],
            loading: true,
            error: '',
            actionLoading: null,
            
            init() {
                this.fetchDocuments();
            },
            
            formatDate(dateString) {
                return new Date(dateString).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
            },
            
            async fetchDocuments() {
                try {
                    const response = await fetch('{{ config('services.python_api.url') }}/documents/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (!response.ok) throw new Error('Gagal mengambil data dokumen');
                    
                    const data = await response.json();
                    this.rows = data.results || [];
                } catch (e) {
                    this.error = e.message;
                } finally {
                    this.loading = false;
                }
            },
            
            async deleteFile(id, title) {
                if (!confirm(`Apakah Anda yakin ingin menghapus file "${title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
                
                this.actionLoading = id;
                try {
                    const response = await fetch(`{{ config('services.python_api.url') }}/documents/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || 'Gagal menghapus file');
                    }
                    
                    // Remove from local state
                    this.rows = this.rows.filter(row => row.id !== id);
                    alert("File berhasil dihapus.");
                    
                } catch (e) {
                    alert(e.message);
                } finally {
                    this.actionLoading = null;
                }
            }
        }
    }
</script>
@endsection
