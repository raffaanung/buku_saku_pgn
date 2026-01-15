
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Upload() {
  const { user } = useAuth();
  const [form, setForm] = useState({ tags: '', description: '' });
  const [categories, setCategories] = useState([]); // List of available categories
  const [selectedCategories, setSelectedCategories] = useState([]); // Array of selected category names
  const [searchTerm, setSearchTerm] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (data) {
        setCategories(data.map(c => c.name).filter(c => c !== 'Lainnya'));
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
      // Fallback if API fails (or table doesn't exist yet)
      setCategories(['Prosedur', 'Instruksi Kerja', 'Materi']);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    const newCatName = newCategory.trim();
    
    // Check if already exists locally
    if (categories.some(c => c.toLowerCase() === newCatName.toLowerCase())) {
      alert('Kategori sudah ada!');
      return;
    }

    setAddingCategory(true);
    try {
      const { data } = await api.post('/categories', { name: newCatName });
      // Add to list and select it
      setCategories(prev => [...prev, data.name].sort());
      setSelectedCategories(prev => [...prev, data.name]);
      setNewCategory(''); // Clear input
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Gagal menambah kategori';
      if (errorMessage.includes('Could not find the table') || errorMessage.includes('relation "public.categories" does not exist')) {
        alert('Fitur ini memerlukan update database (Tabel Kategori belum dibuat). Mohon hubungi admin untuk menjalankan script migrasi.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (e, catName) => {
    e.stopPropagation(); // Prevent toggling selection
    if (!window.confirm(`Hapus kategori "${catName}"?`)) return;

    try {
      await api.delete(`/categories/${encodeURIComponent(catName)}`);
      // Update local state
      setCategories(prev => prev.filter(c => c !== catName));
      setSelectedCategories(prev => prev.filter(c => c !== catName));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menghapus kategori');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (!file) {
      setError('Pilih file terlebih dahulu');
      return;
    }
    if (selectedCategories.length === 0) {
      setError('Pilih minimal satu kategori');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tags', form.tags);
      fd.append('description', form.description);
      // Send categories as JSON string to backend
      fd.append('categories', JSON.stringify(selectedCategories));
      
      await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOk('Dokumen berhasil diupload (Menunggu Persetujuan Manager/Admin)');
      setForm({ tags: '', description: '' });
      setSelectedCategories([]);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const f = droppedFiles[0];
      if (f.size > MAX_SIZE) {
        setError('Maksimal ukuran file 10MB');
        return;
      }
      setFile(f);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      if (f.size > MAX_SIZE) {
        setError('Maksimal ukuran file 10MB');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setFile(f);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Upload Dokumen</h2>
          <p className="text-slate-500 text-sm mt-1">Judul akan otomatis diambil dari nama file.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* File Dropzone */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">File Dokumen</label>
              <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer text-center group
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }
                  ${error && !file ? 'border-red-300 bg-red-50' : ''}
                `}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx" 
                />
                
                {!file ? (
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className={`
                      p-3 rounded-full transition-colors
                      ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}
                    `}>
                      <UploadIcon className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-700">
                        <span className="text-blue-600">Klik untuk upload</span> atau drag & drop
                      </p>
                      <p className="text-xs text-slate-500">
                        PDF, Word (DOC/DOCX) hingga 10MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-100 p-4 rounded-lg text-left">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2 bg-blue-100 rounded text-blue-600 shrink-0">
                        <FileIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                        <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={removeFile}
                      className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded transition-colors"
                      title="Hapus file"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tags (Opsional)</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Contoh: HSE, Safety, Pedoman"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            {/* Category List with Search & Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Kategori</label>
              <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
                <div className="p-3 border-b border-slate-100 bg-slate-50 grid grid-cols-2 gap-3">
                  {/* Search Column */}
                  <div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Cari kategori..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Add Column */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nama kategori baru..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={!newCategory || addingCategory}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[40px]"
                      title="Tambah Kategori Baru"
                    >
                      {addingCategory ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="h-48 overflow-y-auto p-2 space-y-1">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <div
                          key={cat}
                          className={`px-4 py-2 text-sm cursor-pointer rounded-md transition-colors select-none ${
                            isSelected
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                          onClick={() => toggleCategory(cat)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{cat}</span>
                            <div className="flex items-center gap-3">
                              {/* Delete Button (Admin/Manager/Uploader) */}
                              {['admin', 'manager', 'uploader', 'viewer'].includes(user?.role) && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCategory(e, cat)}
                                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Hapus Kategori"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                              
                              {/* Selection Indicator */}
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    !searchTerm && (
                      <div className="px-4 py-8 text-sm text-slate-400 text-center flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Kategori tidak ditemukan</span>
                      </div>
                    )
                  )}
                </div>
              </div>
              {selectedCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedCategories.map(cat => (
                    <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {cat}
                      <button 
                        type="button" 
                        onClick={() => toggleCategory(cat)}
                        className="hover:text-blue-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Deskripsi (Opsional)</label>
              <textarea 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24 resize-none" 
                placeholder="Tambahkan keterangan singkat tentang dokumen ini..." 
                value={form.description} 
                onChange={(e)=>setForm({...form, description:e.target.value})} 
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}
            
            {ok && (
              <div className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-lg text-sm flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 shrink-0" />
                {ok}
              </div>
            )}

            <div className="pt-2">
              <button 
                type="submit"
                disabled={loading} 
                className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                    Sedang Mengunggah...
                  </>
                ) : (
                  <>
                    <UploadCloudIcon className="w-5 h-5" />
                    Upload Dokumen
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Icons
const UploadIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const FileIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const XIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AlertCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UploadCloudIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SpinnerIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
