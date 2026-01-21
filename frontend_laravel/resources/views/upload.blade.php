@extends('layouts.app')

@section('content')
<div class="max-w-4xl mx-auto" x-data="uploadComponent('{{ session('token') }}')">
    <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 class="text-xl font-bold mb-6 text-slate-800 border-b pb-4">Upload Dokumen Baru</h2>
        
        <form @submit.prevent="submitUpload" class="space-y-6">
            
            <!-- File Input Area -->
            <div 
                class="border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer"
                :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'"
                @dragover.prevent="isDragging = true"
                @dragleave.prevent="isDragging = false"
                @drop.prevent="handleDrop"
                @click="$refs.fileInput.click()"
            >
                <input type="file" x-ref="fileInput" class="hidden" @change="handleFileSelect" />
                
                <template x-if="!file">
                    <div class="space-y-2">
                        <div class="text-4xl text-slate-400">📄</div>
                        <p class="font-medium text-slate-700">Klik atau drag file ke sini</p>
                        <p class="text-xs text-slate-500">PDF, DOCX (Max 10MB)</p>
                    </div>
                </template>
                
                <template x-if="file">
                    <div class="space-y-2">
                        <div class="text-4xl text-blue-500">📄</div>
                        <p class="font-medium text-slate-800" x-text="file.name"></p>
                        <p class="text-xs text-slate-500" x-text="formatSize(file.size)"></p>
                        <button type="button" @click.stop="file = null" class="text-xs text-red-600 hover:underline">Hapus File</button>
                    </div>
                </template>
            </div>

            <!-- Categories -->
            <div class="space-y-2">
                <label class="block text-sm font-medium text-slate-700">Kategori</label>
                
                <!-- Selected Categories -->
                <div class="flex flex-wrap gap-2 mb-2">
                    <template x-for="cat in selectedCategories" :key="cat">
                        <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
                            <span x-text="cat"></span>
                            <button type="button" @click="toggleCategory(cat)" class="ml-1 text-blue-600 hover:text-blue-900">×</button>
                        </span>
                    </template>
                </div>

                <!-- Category Selector -->
                <div class="relative" x-data="{ open: false }">
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            x-model="searchTerm" 
                            @focus="open = true"
                            @click.outside="open = false"
                            placeholder="Cari atau pilih kategori..." 
                            class="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                        <div class="flex gap-2">
                            <input 
                                type="text" 
                                x-model="newCategory" 
                                placeholder="Baru..." 
                                class="w-32 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                            <button 
                                type="button" 
                                @click="handleAddCategory" 
                                class="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                :disabled="!newCategory.trim() || addingCategory"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <!-- Dropdown List -->
                    <div x-show="open && filteredCategories.length > 0" class="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto">
                        <template x-for="cat in filteredCategories" :key="cat">
                            <div 
                                @click="toggleCategory(cat); open = false; searchTerm = ''"
                                class="px-4 py-2 hover:bg-slate-100 cursor-pointer text-sm flex justify-between items-center"
                                :class="selectedCategories.includes(cat) ? 'bg-blue-50 text-blue-600' : 'text-slate-700'"
                            >
                                <span x-text="cat"></span>
                                <span x-show="selectedCategories.includes(cat)">✓</span>
                            </div>
                        </template>
                    </div>
                </div>
            </div>

            <!-- Tags -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Tags (pisahkan dengan koma)</label>
                <input type="text" x-model="tags" class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Contoh: migas, safety, 2024">
            </div>

            <!-- Description -->
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Deskripsi (Opsional)</label>
                <textarea x-model="description" rows="3" class="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"></textarea>
            </div>

            <!-- Submit Button -->
            <button 
                type="submit" 
                class="w-full bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="loading || !file || selectedCategories.length === 0"
            >
                <span x-show="!loading">Upload Dokumen</span>
                <span x-show="loading">Mengupload...</span>
            </button>

            <!-- Status Messages -->
            <div x-show="error" class="bg-red-100 text-red-700 p-3 rounded text-sm" x-text="error"></div>
            <div x-show="success" class="bg-green-100 text-green-700 p-3 rounded text-sm" x-text="success"></div>

        </form>
    </div>
</div>

<script>
    function uploadComponent(token) {
        return {
            file: null,
            tags: '',
            description: '',
            categories: [],
            selectedCategories: [],
            searchTerm: '',
            newCategory: '',
            
            loading: false,
            addingCategory: false,
            error: '',
            success: '',
            isDragging: false,
            
            init() {
                this.fetchCategories();
            },
            
            get filteredCategories() {
                return this.categories.filter(c => 
                    c.toLowerCase().includes(this.searchTerm.toLowerCase())
                );
            },
            
            formatSize(bytes) {
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
                return (bytes / 1024 / 1024).toFixed(2) + ' MB';
            },
            
            handleFileSelect(e) {
                if (e.target.files.length) {
                    this.file = e.target.files[0];
                }
            },
            
            handleDrop(e) {
                this.isDragging = false;
                if (e.dataTransfer.files.length) {
                    this.file = e.dataTransfer.files[0];
                }
            },
            
            toggleCategory(cat) {
                if (this.selectedCategories.includes(cat)) {
                    this.selectedCategories = this.selectedCategories.filter(c => c !== cat);
                } else {
                    this.selectedCategories.push(cat);
                }
            },
            
            async fetchCategories() {
                try {
                    const response = await fetch('http://localhost:8000/categories', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        this.categories = data.map(c => c.name);
                    }
                } catch (e) {
                    console.error('Failed to fetch categories', e);
                    this.categories = ['Prosedur', 'Instruksi Kerja', 'Materi']; // Fallback
                }
            },
            
            async handleAddCategory() {
                if (!this.newCategory.trim()) return;
                this.addingCategory = true;
                
                try {
                    const response = await fetch('http://localhost:8000/categories', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ name: this.newCategory.trim() })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.categories.push(data.name);
                        this.selectedCategories.push(data.name);
                        this.newCategory = '';
                    } else {
                        throw new Error('Gagal menambah kategori');
                    }
                } catch (e) {
                    alert(e.message);
                } finally {
                    this.addingCategory = false;
                }
            },
            
            async submitUpload() {
                if (!this.file || this.selectedCategories.length === 0) return;
                
                this.loading = true;
                this.error = '';
                this.success = '';
                
                const formData = new FormData();
                formData.append('file', this.file);
                formData.append('title', this.file.name); // Default title
                formData.append('category_names', JSON.stringify(this.selectedCategories));
                formData.append('tags', this.tags);
                formData.append('description', this.description);
                
                try {
                    const response = await fetch('http://localhost:8000/documents/upload', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                    
                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.detail || 'Upload failed');
                    }
                    
                    this.success = 'Dokumen berhasil diupload!';
                    this.file = null;
                    this.tags = '';
                    this.description = '';
                    this.selectedCategories = [];
                    // Reset file input
                    this.$refs.fileInput.value = '';
                    
                } catch (e) {
                    this.error = e.message;
                } finally {
                    this.loading = false;
                }
            }
        }
    }
</script>
@endsection
