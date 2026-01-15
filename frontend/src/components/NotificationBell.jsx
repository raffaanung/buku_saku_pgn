import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter(n => !n.is_read).length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  function BellIcon(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (!isOpen) {
            fetchNotifications();
          }
        }}
        className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">Tidak ada notifikasi</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => handleMarkRead(n.id)}
                >
                  <p className="text-sm text-slate-800 mb-1">{n.message}</p>
                  <span className="text-xs text-slate-400">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const BellIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);
