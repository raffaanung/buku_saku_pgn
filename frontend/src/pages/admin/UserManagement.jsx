import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Pencil as PencilIcon, Check as CheckIcon, X as XIcon, Key as KeyIcon, Trash as TrashIcon } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer', position: '', instansi: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editedRoles, setEditedRoles] = useState({});
  const [editRoleId, setEditRoleId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [approveForm, setApproveForm] = useState({ name: '' });
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/admin/users');
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/admin/users', form);
      alert('User berhasil dibuat/diupdate.');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'viewer', position: '', instansi: '' });
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!confirm(`Reset password untuk ${resetEmail}?`)) return;
    try {
      await api.post('/auth/admin/reset-password', { email: resetEmail });
      alert(`Password reset berhasil dikirim ke ${resetEmail}`);
      setResetEmail('');
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pencarian User */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Pencarian User</h2>
        </div>
        <input
          type="text"
          placeholder="Cari nama atau email..."
          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Hasil Pencarian ({filteredUsers.length})</h3>
            <div className="border rounded-lg max-h-[400px] overflow-y-auto shadow-sm">
              {filteredUsers.length > 0 ? (
                <ul className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.map(u => (
                    <li key={u.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800 text-base">{u.name}</div>
                          <div className="text-sm text-slate-500">{u.email}</div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex flex-wrap items-center gap-3 sm:justify-end w-full sm:w-auto">
                          
                          {/* Role Badge & Edit */}
                          {u.email !== 'admin.qaqc@gmail.com' && u.role !== 'admin' && editRoleId === u.id ? (
                            <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit min-w-[80px]">
                              {['viewer', 'uploader', 'manager'].map((roleOption) => (
                                <button
                                  key={roleOption}
                                  onClick={async () => {
                                    setEditedRoles(prev => ({ ...prev, [u.id]: roleOption }));
                                    try {
                                      const payload = {
                                        name: u.name,
                                        email: u.email,
                                        password: 'unchanged',
                                        role: roleOption,
                                        position: u.position || '',
                                        instansi: u.instansi || '',
                                        is_active: u.is_active || false
                                      };
                                      await api.post('/auth/admin/users', payload);
                                      alert('Role user diperbarui');
                                      setEditRoleId(null);
                                      fetchUsers();
                                    } catch (err) {
                                      alert(err.response?.data?.error || err.message);
                                    }
                                  }}
                                  className={`px-2 py-1 text-xs rounded-md transition-colors capitalize text-center ${
                                    (editedRoles[u.id] ?? u.role) === roleOption
                                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {roleOption}
                                </button>
                              ))}
                              <button
                                onClick={() => setEditRoleId(null)}
                                className="p-1 text-slate-400 hover:text-slate-600 mt-1 border-t border-slate-200 w-full flex justify-center"
                                title="Batal"
                              >
                                <XIcon size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 border border-slate-200">
                              <span className={`text-xs font-bold uppercase tracking-wide ${
                                (editedRoles[u.id] ?? u.role) === 'admin' ? 'text-purple-700' :
                                (editedRoles[u.id] ?? u.role) === 'manager' ? 'text-blue-700' :
                                (editedRoles[u.id] ?? u.role) === 'uploader' ? 'text-green-700' :
                                'text-slate-600'
                              }`}>
                                {editedRoles[u.id] ?? u.role}
                              </span>
                              {u.email !== 'admin.qaqc@gmail.com' && u.role !== 'admin' && (
                                <button
                                  onClick={() => {
                                    setEditRoleId(u.id);
                                    setEditedRoles(prev => ({ ...prev, [u.id]: u.role }));
                                  }}
                                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                  title="Ubah Role"
                                >
                                  <PencilIcon size={14} />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Status */}
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border ${
                              u.is_active 
                                ? 'bg-green-50 text-green-700 border-green-100' 
                                : 'bg-orange-50 text-orange-700 border-orange-100'
                            }`}>
                             <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                             {u.is_active ? 'Active' : 'Pending'}
                          </div>

                          {/* Action Buttons */}
                          {u.email !== 'admin.qaqc@gmail.com' && (
                            <div className="flex flex-wrap items-center gap-1 sm:pl-4 sm:border-l sm:border-slate-200">
                              {!u.is_active && (
                                <>
                                  <button
                                    onClick={() => {
                                      setApproveTarget(u);
                                      setApproveForm({ name: u.name || '' });
                                    }}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                    title="Approve User"
                                  >
                                    <CheckIcon />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Tolak registrasi ${u.name}?`)) return;
                                      try {
                                        await api.post('/auth/admin/users/reject', { email: u.email });
                                        alert('Registrasi ditolak');
                                        fetchUsers();
                                      } catch (e) {
                                        alert(e.response?.data?.error || e.message);
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Reject User"
                                  >
                                    <XIcon />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => setResetEmail(u.email)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Reset Password"
                              >
                                <KeyIcon size={16} />
                              </button>
                              
                              <button
                                onClick={async () => {
                                  if (!confirm(`Hapus user ${u.name}?`)) return;
                                  try {
                                    await api.delete(`/auth/admin/users/${u.id}`);
                                    alert('User dihapus');
                                    fetchUsers();
                                  } catch (e) {
                                    alert(e.response?.data?.error || e.message);
                                  }
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus User"
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-slate-500 bg-slate-50">
                  <p className="text-sm">Tidak ada user yang cocok dengan pencarian "{search}"</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Manajemen User</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Batal' : 'Tambah User Baru'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateUser} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold mb-4">Form User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input required className="w-full border rounded px-3 py-2" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input required type="text" className="w-full border rounded px-3 py-2" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jabatan</label>
                <input className="w-full border rounded px-3 py-2" value={form.position} onChange={e => setForm({...form, position: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instansi</label>
                <input className="w-full border rounded px-3 py-2" value={form.instansi} onChange={e => setForm({...form, instansi: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select className="w-full border rounded px-3 py-2" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="viewer">Viewer</option>
                  <option value="uploader">Uploader</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Simpan</button>
            </div>
          </form>
        )}

        {/* Tabel User */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Nama / Email</th>
                <th className="px-6 py-3">Password</th>
                <th className="px-6 py-3">Instansi</th>
                <th className="px-6 py-3">Jabatan</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{u.password || '-'}</code>
                  </td>
                  <td className="px-6 py-4">{u.instansi || '-'}</td>
                  <td className="px-6 py-4">{u.position || '-'}</td>
                  <td className="px-6 py-4 capitalize">
                    {u.email !== 'admin.qaqc@gmail.com' && u.role !== 'admin' && editRoleId === u.id ? (
                      <div className="flex flex-col gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit min-w-[80px]">
                        {['viewer', 'uploader', 'manager'].map((roleOption) => (
                          <button
                            key={roleOption}
                            onClick={async () => {
                              setEditedRoles(prev => ({ ...prev, [u.id]: roleOption }));
                              try {
                                const payload = {
                                  name: u.name,
                                  email: u.email,
                                  password: 'unchanged',
                                  role: roleOption,
                                  position: u.position || '',
                                  instansi: u.instansi || '',
                                  is_active: u.is_active || false
                                };
                                await api.post('/auth/admin/users', payload);
                                alert('Role user diperbarui');
                                setEditRoleId(null);
                                fetchUsers();
                              } catch (err) {
                                alert(err.response?.data?.error || err.message);
                              }
                            }}
                            className={`px-2 py-1 text-xs rounded-md transition-colors capitalize text-center ${
                              (editedRoles[u.id] ?? u.role) === roleOption
                                ? 'bg-blue-600 text-white font-medium shadow-sm'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {roleOption}
                          </button>
                        ))}
                        <button
                          onClick={() => setEditRoleId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 mt-1 border-t border-slate-200 w-full flex justify-center"
                          title="Batal"
                        >
                          <XIcon size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold uppercase tracking-wide ${
                          (editedRoles[u.id] ?? u.role) === 'admin' ? 'text-purple-700' :
                          (editedRoles[u.id] ?? u.role) === 'manager' ? 'text-blue-700' :
                          (editedRoles[u.id] ?? u.role) === 'uploader' ? 'text-green-700' :
                          'text-slate-600'
                        }`}>
                          {editedRoles[u.id] ?? u.role}
                        </span>
                        {u.email !== 'admin.qaqc@gmail.com' && u.role !== 'admin' && (
                          <button
                            onClick={() => {
                              setEditRoleId(u.id);
                              setEditedRoles(prev => ({ ...prev, [u.id]: u.role }));
                            }}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                            title="Ubah Role"
                          >
                            <PencilIcon size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.email === 'admin.qaqc@gmail.com' ? (
                      <span className="text-slate-400 text-xs">-</span>
                    ) : (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${
                          u.is_active 
                            ? 'bg-green-50 text-green-700 border-green-100' 
                            : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                         <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                         {u.is_active ? 'Active' : 'Pending'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {u.email !== 'admin.qaqc@gmail.com' && (
                      <div className="flex items-center gap-2">
                      {!u.is_active && (
                        <>
                          <button
                            onClick={async () => {
                              setApproveTarget(u);
                              setApproveForm({ name: u.name || '' });
                            }}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                            title="Approve User"
                          >
                            <CheckIcon size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Tolak registrasi ${u.name}?`)) return;
                              try {
                                await api.post('/auth/admin/users/reject', { email: u.email });
                                alert('Registrasi ditolak');
                                fetchUsers();
                              } catch (e) {
                                alert(e.response?.data?.error || e.message);
                              }
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Reject User"
                          >
                            <XIcon size={16} />
                          </button>
                        </>
                        )}
                        
                        <button
                          onClick={() => setResetEmail(u.email)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Reset Password"
                        >
                          <KeyIcon size={16} />
                        </button>
                        
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus user ${u.name}?`)) return;
                            try {
                              await api.delete(`/auth/admin/users/${u.id}`);
                              alert('User dihapus');
                              fetchUsers();
                            } catch (e) {
                              alert(e.response?.data?.error || e.message);
                            }
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Hapus User"
                        >
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approve Pending User */}
      {approveTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Approve User</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold mb-1">Nama</div>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={approveForm.name}
                  onChange={(e) => setApproveForm({ ...approveForm, name: e.target.value })}
                />
              </div>
              <p className="text-sm text-slate-500">
                User akan diaktifkan dengan password yang mereka daftarkan. Role default adalah <strong>{approveTarget.role}</strong>.
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setApproveTarget(null);
                  setApproveForm({ name: '' });
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Tutup
              </button>
              <button
                onClick={async () => {
                  try {
                    const payload = {
                      name: approveForm.name || approveTarget.name,
                      email: approveTarget.email,
                      password: 'unchanged', // Password user tidak diubah
                      role: approveTarget.role || 'viewer',
                      position: approveTarget.position || '',
                      instansi: approveTarget.instansi || '',
                      is_active: true
                    };
                    await api.post('/auth/admin/users', payload);
                    alert('User diaktifkan');
                    setApproveTarget(null);
                    setApproveForm({ name: '' });
                    fetchUsers();
                  } catch (e) {
                    alert(e.response?.data?.error || e.message);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <p className="text-sm text-slate-600 mb-6">
              Kirim password baru ke email <strong>{resetEmail}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setResetEmail('')}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
              >
                Batal
              </button>
              <button 
                onClick={handleResetPassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Kirim Email Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
