import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Pengaturan Profil</h2>
      <p className="text-sm text-slate-500 mb-6">
        Halaman ini menampilkan informasi dasar profil yang digunakan saat login.
      </p>

      <div className="space-y-4">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Nama</div>
          <div className="px-3 py-2 border rounded-md bg-slate-50 text-slate-800 text-sm">
            {user?.name}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Email</div>
          <div className="px-3 py-2 border rounded-md bg-slate-50 text-slate-800 text-sm break-all">
            {user?.email}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Role</div>
          <div className="px-3 py-2 border rounded-md bg-slate-50 text-slate-800 text-sm capitalize">
            {user?.role}
          </div>
        </div>
      </div>
    </div>
  );
}

