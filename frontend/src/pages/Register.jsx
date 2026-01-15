  import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const nav = useNavigate();
  // const { login } = useAuth(); // Login tidak otomatis lagi karena butuh approval
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', position: '', instansi: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Semua field wajib diisi');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Konfirmasi password tidak sesuai');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        position: form.position.trim(),
        instansi: form.instansi.trim()
      });
      alert('Registrasi berhasil. Silakan tunggu persetujuan Admin untuk dapat login.');
      nav('/login');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <div className="text-xl font-semibold mb-4">Register User</div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Instansi" value={form.instansi} onChange={(e) => setForm({ ...form, instansi: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Jabatan / Posisi" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="w-full border rounded px-3 py-2" placeholder="Confirm Password" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full bg-blue-600 text-white rounded py-2">{loading ? 'Memproses...' : 'Daftar'}</button>
        </form>
        <div className="text-sm mt-4">
          Sudah punya akun? <Link to="/login" className="text-blue-600">Login</Link>
        </div>
      </div>
    </div>
  );
}
