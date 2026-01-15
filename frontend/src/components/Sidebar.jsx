import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import classNames from 'classnames';

export default function Sidebar({ open, setOpen }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isUploader = user?.role === 'uploader';
  
  // Logic:
  // Viewer: Read only (Home, Favorites)
  // Uploader: Upload, History (view own), Home, Favorites
  // Manager: Upload, Delete, History (approve/reject), Home, Favorites
  // Admin: All + User Management
  
  const canUpload = isAdmin || isManager || isUploader;
  const canDelete = isAdmin || isManager;
  const canViewHistory = isAdmin || isManager || isUploader;
  const canManageUsers = isAdmin;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={classNames(
          'bg-slate-900 text-white h-screen transition-all duration-300 ease-in-out z-30 flex flex-col',
          // Mobile Styles: Fixed, Full Height
          'fixed inset-y-0 left-0', 
          open ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64',
          
          // Desktop Styles: Static (flow), Width transition
          'md:static md:translate-x-0 md:shadow-none',
          open ? 'md:w-64' : 'md:w-16'
        )}
      >
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800 shrink-0">
          <span className={classNames("font-bold transition-opacity whitespace-nowrap text-lg tracking-wider text-blue-400", !open && "md:hidden")}>
            PMO QA/QC
          </span>
          <span className={classNames("font-bold text-xl text-blue-400 md:block hidden mx-auto", open && "hidden")}>
            
          </span>
          
          {/* Desktop Toggle Button (Moved to Header) */}
          <button 
             onClick={() => setOpen(!open)} 
             className="hidden md:block text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors focus:outline-none"
             title={open ? "Collapse Sidebar" : "Expand Sidebar"}
           >
              {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
           </button>

          {/* Mobile Close Button */}
          <button 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 focus:outline-none"
            onClick={() => setOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          <MenuLink to="/dashboard" label="Beranda" icon={<HomeIcon />} active={pathname === '/dashboard'} showLabel={open} />
          <MenuLink to="/dashboard/favorites" label="Favorit Saya" icon={<StarIcon />} active={pathname.startsWith('/dashboard/favorites')} showLabel={open} />
          {canUpload && <MenuLink to="/dashboard/upload" label="Upload Dokumen" icon={<UploadIcon />} active={pathname.startsWith('/dashboard/upload')} showLabel={open} />}
          {canDelete && <MenuLink to="/dashboard/delete" label="Hapus Dokumen" icon={<TrashIcon />} active={pathname.startsWith('/dashboard/delete')} showLabel={open} />}
          {canViewHistory && <MenuLink to="/dashboard/history" label="Riwayat Dokumen" icon={<HistoryIcon />} active={pathname.startsWith('/dashboard/history')} showLabel={open} />}
          {canManageUsers && <MenuLink to="/dashboard/users" label="Manajemen User" icon={<UsersIcon />} active={pathname.startsWith('/dashboard/users')} showLabel={open} />}
        </nav>
        
        {/* Footer removed since toggle moved up */}
      </div>
    </>
  );
}

function MenuLink({ to, label, icon, active, showLabel }) {
  return (
    <Link
      to={to}
      className={classNames(
        'flex items-center px-3 py-2 rounded-md transition-all duration-200 group relative',
        active ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      )}
    >
      <span className="flex items-center justify-center w-6 h-6 shrink-0">{icon}</span>
      
      {/* Label Text */}
      <span className={classNames(
        "ml-3 text-sm font-medium whitespace-nowrap transition-all duration-300 origin-left overflow-hidden",
        // Logic show/hide label
        showLabel ? "opacity-100 w-40" : "opacity-0 w-0 md:hidden"
      )}>
        {label}
      </span>

      {/* Tooltip for Collapsed State (Desktop Only) */}
      {!showLabel && (
        <div className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg border border-slate-700 pointer-events-none">
          {label}
        </div>
      )}
    </Link>
  );
}

// Simple Icons Components
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const HistoryIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
