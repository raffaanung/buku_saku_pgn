import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import SearchBar from '../components/SearchBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Upload from './admin/Upload.jsx';
import History from './admin/History.jsx';
import DeleteDocument from './admin/DeleteDocument.jsx';
import UserManagement from './admin/UserManagement.jsx';
import Settings from './Settings.jsx';
import Favorites from './Favorites.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Permissions Logic
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isUploader = user?.role === 'uploader';
  
  const canUpload = isAdmin || isManager || isUploader;
  const canDelete = isAdmin || isManager;
  const canViewHistory = isAdmin || isManager || isUploader;
  const canManageUsers = isAdmin;

  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

  // Auto-close sidebar on mobile route change
  const location = useLocation();
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [location]);

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header toggleSidebar={() => setSidebarOpen((v) => !v)} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route
                index
                element={
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Selamat Datang, {user?.name}
                      </h2>
                      <p className="text-slate-500">
                        Gunakan kolom pencarian di bawah untuk menemukan dokumen prosedur, instruksi kerja, atau materi lainnya.
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                      <div className="text-lg font-semibold mb-4 text-slate-700">Pencarian Dokumen</div>
                      <SearchBar />
                    </div>
                  </div>
                }
              />
              <Route path="favorites" element={<Favorites />} />
              {canUpload && <Route path="upload" element={<Upload />} />}
              {canViewHistory && <Route path="history" element={<History />} />}
              {canDelete && <Route path="delete" element={<DeleteDocument />} />}
              {canManageUsers && <Route path="users" element={<UserManagement />} />}
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
