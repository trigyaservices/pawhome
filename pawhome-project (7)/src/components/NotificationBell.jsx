import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        className="notif-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && <span className="notif-badge" />}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="row" style={{ padding: '4px 8px 8px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                className="btn sm ghost"
                style={{ padding: '2px 8px', fontSize: 12 }}
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
            {notifications.length === 0 ? (
              <p className="meta" style={{ textAlign: 'center', padding: '20px 8px', margin: 0 }}>
                No notifications right now
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: n.read ? 'transparent' : 'var(--mint)',
                    marginBottom: 4,
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: n.read ? 600 : 700, fontSize: 13, color: 'var(--ink)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{n.body}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
