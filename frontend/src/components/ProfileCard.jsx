import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfileCard() {
  const { user } = useAuth();
  return (
    <div className="border rounded p-4 bg-white shadow">
      <div className="text-lg font-semibold mb-2">Profil</div>
      <div className="text-sm">
        <div>Nama: {user?.name}</div>
        <div>Email: {user?.email}</div>
        <div>Role: {user?.role}</div>
      </div>
    </div>
  );
}

