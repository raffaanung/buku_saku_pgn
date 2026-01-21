@extends('layouts.app')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden" x-data="historyComponent('{{ session('token') }}', {{ json_encode(in_array(session('user')['role'], ['admin', 'manager', 'superuser'])) }})">
    <div class="p-6 border-b border-slate-100">
        <h2 class="text-xl font-bold text-slate-800">Riwayat Dokumen</h2>
        <p class="text-slate-500 text-sm mt-1">Daftar semua dokumen yang diupload dan dihapus.</p>
    </div>

    <!-- Loading State -->
    <div x-show="loading" class="p-6 text-center text-slate-500">
        Memuat riwayat...
    </div>

    <!-- Error State -->
    <div x-show="error" class="p-4 m-6 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100" x-text="error" style="display: none;"></div>

    <!-- Empty State -->
    <div x-show="!loading && !error && rows.length === 0" class="p-6 text-center text-slate-500" style="display: none;">
        Belum ada riwayat dokumen.
    </div>

    <!-- Table -->
    <div x-show="!loading && rows.length > 0" class="overflow-x-auto" style="display: none;">
        <table class="w-full text-left text-sm text-slate-600 min-w-[640px]">
            <thead class="bg-slate-50 text-slate-700 uppercase font-medium">
                <tr>
                    <th class="px-6 py-3">Judul Dokumen</th>
                    <th class="px-6 py-3">Uploader</th>
                    <th class="px-6 py-3">Status</th>
                    <th class="px-6 py-3">Tanggal</th>
                    <template x-if="canManage">
                        <th class="px-6 py-3">Aksi</th>
                    </template>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
                <template x-for="row in rows" :key="row.id">
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-6 py-4 font-medium text-slate-800">
                            <div class="flex items-center gap-2">
                                <span class="uppercase text-xs font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">FILE</span>
                                <a :href="row.file_url ? (row.file_url.startsWith('http') ? row.file_url : '{{ config('services.python_api.url') }}' + row.file_url) : '#'" target="_blank" class="hover:text-blue-600 hover:underline" x-text="row.title"></a>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                            <div x-text="row.uploader?.name || 'Unknown'"></div>
                            <div class="text-xs text-slate-400" x-text="row.uploader?.email"></div>
                        </td>
                        <td class="px-6 py-4">
                            <span 
                                class="px-2 py-1 rounded text-xs font-semibold capitalize"
                                :class="{
                                    'bg-yellow-100 text-yellow-800': row.status === 'pending',
                                    'bg-green-100 text-green-800': row.status === 'approved',
                                    'bg-red-100 text-red-800': row.status === 'rejected'
                                }"
                                x-text="row.status">
                            </span>
                            <div x-show="row.rejection_note" class="text-xs text-red-500 mt-1" x-text="row.rejection_note"></div>
                        </td>
                        <td class="px-6 py-4 text-xs" x-text="new Date(row.created_at).toLocaleDateString('id-ID')"></td>
                        
                        <template x-if="canManage">
                            <td class="px-6 py-4">
                                <div class="flex gap-2" x-show="row.status === 'pending'">
                                    <button 
                                        @click="handleStatusChange(row.id, 'approved')"
                                        class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                        :disabled="actionLoading === row.id">
                                        Approve
                                    </button>
                                    <button 
                                        @click="handleStatusChange(row.id, 'rejected')"
                                        class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                                        :disabled="actionLoading === row.id">
                                        Reject
                                    </button>
                                </div>
                                <div x-show="row.status !== 'pending'" class="text-xs text-slate-400 italic">
                                    Processed
                                </div>
                            </td>
                        </template>
                    </tr>
                </template>
            </tbody>
        </table>
    </div>
</div>

<script>
    function historyComponent(token, canManage) {
        return {
            rows: [],
            loading: true,
            error: '',
            actionLoading: null,
            canManage: canManage,
            
            init() {
                this.fetchHistory();
            },
            
            async fetchHistory() {
                try {
                    const response = await fetch('{{ config('services.python_api.url') }}/documents/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    if (!response.ok) throw new Error('Failed to fetch history');
                    
                    const data = await response.json();
                    // Filter for "Riwayat" (Approved/Rejected/Pending if user uploaded it?)
                    // For Admin "Riwayat Masukkan": Verified files (Approved/Rejected).
                    // For User "Riwayat File": Approved files (filtered by backend).
                    this.rows = data.results || [];
                } catch (e) {
                    this.error = e.message;
                } finally {
                    this.loading = false;
                }
            },
            
            async handleStatusChange(id, status) {
                let rejectionNote = null;
                if (status === 'rejected') {
                    rejectionNote = prompt("Masukkan alasan penolakan:");
                    if (!rejectionNote) return;
                }
                
                if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) return;
                
                this.actionLoading = id;
                try {
                    const response = await fetch(`{{ config('services.python_api.url') }}/documents/${id}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ status, note: rejectionNote })
                    });
                    
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || 'Update failed');
                    }
                    
                    // Update local state
                    this.rows = this.rows.map(row => {
                        if (row.id === id) {
                            return { 
                                ...row, 
                                status: status, 
                                rejection_note: rejectionNote 
                            };
                        }
                        return row;
                    });
                    
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
