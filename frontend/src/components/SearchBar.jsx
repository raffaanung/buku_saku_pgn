import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [favIds, setFavIds] = useState([]);
  const [busyFav, setBusyFav] = useState(null);
  const [approved, setApproved] = useState([]);

  const loadFavIds = async () => {
    try {
      const { data } = await api.get('/documents/favorites/ids');
      setFavIds(data.ids || []);
    } catch {
      // abaikan error, tidak kritikal untuk pencarian
    }
  };

  useEffect(() => {
    loadFavIds();
    // load approved docs initially
    (async () => {
      try {
        const { data } = await api.get('/documents/approved');
        setApproved(data.results || []);
      } catch {
        setApproved([]);
      }
    })();
  }, []);

  const toggleFavorite = async (docId, isFav) => {
    try {
      setBusyFav(docId);
      if (isFav) {
        await api.delete(`/documents/${docId}/favorite`);
        setFavIds((prev) => prev.filter((id) => id !== docId));
      } else {
        await api.post(`/documents/${docId}/favorite`);
        setFavIds((prev) => [...prev, docId]);
      }
    } catch {
      // bisa tampilkan toast jika diperlukan
    } finally {
      setBusyFav(null);
    }
  };

  const onSearch = async (e) => {
    e.preventDefault();
    setError('');
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/documents/search', { params: { q } });
      setResults(data.results || []);
      // refresh favorit untuk sinkronisasi
      loadFavIds();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
          placeholder="Cari dokumen relevan, misal: welder"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Cari</button>
      </form>
      {loading && <div className="text-sm">Mencari...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="grid gap-3">
        {results.map((r) => (
          <div key={r.id} className="relative p-3 border rounded bg-white hover:bg-slate-50">
            <button
              title="Favoritkan"
              className="absolute top-2 right-2 text-yellow-500"
              onClick={() => toggleFavorite(r.id, favIds.includes(r.id))}
              disabled={busyFav === r.id}
            >
              <span className="text-xl">{favIds.includes(r.id) ? '★' : '☆'}</span>
            </button>
            <a href={r.file_url || '#'} target={r.file_url ? "_blank" : undefined} rel="noreferrer" className="block">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs opacity-70">{Array.isArray(r.tags) ? r.tags.join(', ') : ''}</div>
              <div className="text-xs mt-1">Status: {r.status}</div>
            </a>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <div className="text-sm font-semibold text-slate-700 mb-2">Dokumen Disetujui</div>
        <div className="grid gap-3">
          {approved.map((r) => (
            <a key={r.id} href={r.file_url || '#'} target={r.file_url ? "_blank" : undefined} rel="noreferrer" className="p-3 border rounded bg-white hover:bg-slate-50 block">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs opacity-70">{Array.isArray(r.tags) ? r.tags.join(', ') : ''}</div>
              <div className="text-xs mt-1">Status: {r.status}</div>
            </a>
          ))}
          {approved.length === 0 && (
            <div className="text-xs text-slate-500">Belum ada dokumen disetujui.</div>
          )}
        </div>
      </div>
    </div>
  );
}
