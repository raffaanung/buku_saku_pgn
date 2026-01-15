import React, { useEffect, useState } from 'react';
import api from '../services/api.js';

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/documents/favorites');
      setItems(data.favorites || []);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || '';
      if (msg.includes('favorites') || msg.includes('schema cache')) {
        setDisabled(true);
        setError('');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unstar = async (id) => {
    try {
      setBusy(id);
      await api.delete(`/documents/${id}/favorite`);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch {
      // ignore
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Favorit Saya</h2>
        <p className="text-slate-500 text-sm">Dokumen yang Anda bintangi.</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        {loading && <div className="text-sm text-slate-600">Memuat...</div>}
        {disabled && (
          <div className="text-sm text-slate-600">
            Fitur favorit belum diaktifkan pada database. Silakan aktifkan untuk menggunakan fitur ini.
          </div>
        )}
        {error && !disabled && <div className="text-sm text-red-600">Error: {error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="text-sm text-slate-500">Belum ada dokumen favorit.</div>
        )}
        <div className="grid gap-3">
          {items.map((it) => (
            <div key={it.id} className="relative p-3 border rounded bg-white hover:bg-slate-50">
              <button
                className="absolute top-2 right-2 text-yellow-500"
                onClick={() => unstar(it.id)}
                disabled={busy === it.id}
                title="Hapus dari favorit"
              >
                <span className="text-xl">★</span>
              </button>
              <div className="font-medium">{it.title}</div>
              <div className="text-xs opacity-70">{Array.isArray(it.tags) ? it.tags.join(', ') : ''}</div>
              <div className="text-xs mt-1">Status: {it.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
