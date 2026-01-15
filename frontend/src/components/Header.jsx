import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="bg-white shadow-sm border-b px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden text-slate-500 hover:text-slate-700 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="font-semibold text-slate-700 text-lg"></div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifikasi untuk semua role */}
        <NotificationBell />

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border ring-1 ring-black ring-opacity-5">
              <button
                onClick={() => { setDropdownOpen(false); navigate('/dashboard/settings'); }}
                className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Settings
              </button>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
