import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';

export default function DeleteDocument() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadList = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/documents');
      setResults(data.documents || []);
      if (!data.documents || data.documents.length === 0) {
        setError('Tidak ada dokumen tersedia untuk dihapus.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar dokumen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const { data } = await api.get(`/documents/search?q=${encodeURIComponent(query)}`);
      setResults(data.results || []);
      if (!data.results || data.results.length === 0) {
        setError('Tidak ada dokumen ditemukan.');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal mencari dokumen.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus dokumen "${title}"?`)) return;

    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      // Remove from list
      setResults(prev => prev.filter(doc => doc.id !== id));
      alert('Dokumen berhasil dihapus.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal menghapus dokumen.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Hapus Dokumen</h2>
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 text-sm">
            Daftar dokumen yang belum dihapus. Gunakan pencarian untuk memfilter.
          </p>
          <button
            onClick={loadList}
            disabled={loading}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm"
          >
            {loading ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contoh: dokumen tentang prosedur pengelasan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Mencari...' : 'Cari'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {results.map((doc) => (
            <div key={doc.id} className="flex items-start justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex-1 pr-4">
                <h3 className="font-semibold text-slate-800 mb-1">{doc.title}</h3>
                <div className="text-xs text-slate-500 flex flex-wrap gap-2 mb-2">
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-700 uppercase">{doc.file_type?.split('/').pop() || 'DOC'}</span>
                  <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '-'}</span>
                </div>
                {doc.file_url && (
                  <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs">
                    Lihat Dokumen
                  </a>
                )}
              </div>
              
              <button
                onClick={() => handleDelete(doc.id, doc.title)}
                disabled={deletingId === doc.id}
                className="shrink-0 px-3 py-1.5 bg-red-100 text-red-600 rounded text-sm font-medium hover:bg-red-200 transition-colors"
              >
                {deletingId === doc.id ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          ))}
          {!loading && results.length === 0 && !error && (
            <div className="text-sm text-slate-500">Tidak ada dokumen.</div>
          )}
        </div>
      </div>
    </div>
  );
}
