import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function History() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const canManage = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/documents/history');
        setRows(data.history || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleStatusChange = async (id, status) => {
    let rejectionNote = null;
    if (status === 'rejected') {
      rejectionNote = prompt("Masukkan alasan penolakan:");
      if (!rejectionNote) return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) return;

    setActionLoading(id);
    try {
      await api.put(`/documents/${id}/status`, { status, rejection_note: rejectionNote });
      setRows(rows.map(row =>
        row.id === id
          ? {
              ...row,
              status,
              rejection_note: rejectionNote,
              approved_by_name: status === 'approved' ? user.name : null,
              rejected_by_name: status === 'rejected' ? user.name : null
            }
          : row
      ));
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Riwayat Dokumen</h2>
        <p className="text-slate-500 text-sm mt-1">Daftar semua dokumen yang diupload dan dihapus.</p>
      </div>
      
      {loading && <div className="p-6 text-center text-slate-500">Memuat riwayat...</div>}
      
      {error && (
        <div className="p-4 m-6 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
          Error: {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="p-6 text-center text-slate-500">Belum ada riwayat dokumen.</div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] sm:text-sm text-slate-600 min-w-[640px]">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Judul Dokumen</th>
                <th className="px-6 py-3">Uploader</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Info Proses</th>
                <th className="px-6 py-3">Tanggal</th>
                {canManage && <th className="px-6 py-3">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-xs font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                        {row.type?.split('/').pop()?.substring(0, 4) || 'FILE'}
                      </span>
                      {row.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">{row.uploader}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                        row.status === 'deleted' ? 'bg-red-100 text-red-600' :
                        row.status === 'approved' ? 'bg-green-100 text-green-600' :
                        row.status === 'rejected' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {row.status === 'deleted' ? 'Terhapus' : 
                         row.status === 'approved' ? 'Disetujui' :
                         row.status === 'rejected' ? 'Ditolak' : 'Upload'}
                      </span>
                      {row.status === 'rejected' && row.rejection_note && (
                        <span className="text-xs text-red-500 italic">Note: {row.rejection_note}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {row.deleted_at ? (
                      <div>Deleted by: <span className="font-semibold">{row.deleted_by_name}</span></div>
                    ) : row.status === 'approved' ? (
                      <div>Approved by: <span className="font-semibold">{row.approved_by_name}</span></div>
                    ) : row.status === 'rejected' ? (
                      <div>Rejected by: <span className="font-semibold">{row.rejected_by_name}</span></div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div>Upload: {new Date(row.uploaded_at).toLocaleDateString('id-ID')}</div>
                    {row.deleted_at && (
                      <div className="text-red-500">Del: {new Date(row.deleted_at).toLocaleDateString('id-ID')}</div>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4">
                      {row.status === 'pending' && !row.deleted_at && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStatusChange(row.id, 'approved')}
                            disabled={actionLoading === row.id}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Acc
                          </button>
                          <button
                            onClick={() => handleStatusChange(row.id, 'rejected')}
                            disabled={actionLoading === row.id}
                            className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
