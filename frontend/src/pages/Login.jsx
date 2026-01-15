import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [mode, setMode] = useState('user'); // 'admin' | 'user'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useAuth();

  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', passkey: '', password: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'user') {
        const { data } = await api.post('/auth/login/user', userForm);
        login(data);
      } else {
        const { data } = await api.post('/auth/login/admin', adminForm);
        login(data);
      }
      nav('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <div className="text-xl font-semibold mb-4">Login</div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode('user')} className={`px-3 py-1 rounded ${mode==='user'?'bg-blue-600 text-white':'bg-slate-200'}`}>Login User</button>
          <button onClick={() => setMode('admin')} className={`px-3 py-1 rounded ${mode==='admin'?'bg-blue-600 text-white':'bg-slate-200'}`}>Login Admin</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'user' ? (
            <>
              <input className="w-full border rounded px-3 py-2" placeholder="Nama" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
            </>
          ) : (
            <>
              <input className="w-full border rounded px-3 py-2" placeholder="Nama" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" placeholder="Passkey" value={adminForm.passkey} onChange={(e) => setAdminForm({ ...adminForm, passkey: e.target.value })} />
              <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
            </>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full bg-blue-600 text-white rounded py-2">{loading ? 'Memproses...' : 'Continue'}</button>
        </form>
        <div className="text-sm mt-4">
          Belum punya akun? <Link to="/register" className="text-blue-600">Register</Link>
        </div>
      </div>
    </div>
  );
}

