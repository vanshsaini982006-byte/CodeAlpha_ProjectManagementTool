import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { notificationApi } from '../services/resources';
import { useSocket } from '../context/SocketContext';
import { timeAgo } from '../utils/format';
import Avatar from './Avatar';
import { Spinner } from './Feedback';

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { notifications, setNotifications, unreadCount, setUnreadCount } = useSocket();
  const ref = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await notificationApi.list();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await notificationApi.markAllRead().catch(() => {});
  };

  const markOneRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await notificationApi.markRead(id).catch(() => {});
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-surface-50/55 hover:bg-ink-800 hover:text-surface-50 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[26rem] overflow-y-auto card animate-fade-in z-40">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800">
            <span className="text-sm font-semibold text-surface-50">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-medium text-violet-400 hover:text-violet-300">
                Mark all read
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center py-8 text-surface-50/40">
              <Spinner />
            </div>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-surface-50/40">You're all caught up.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li key={n._id}>
                  <Link
                    to={n.task ? `/tasks/${n.task}` : n.project ? `/projects/${n.project}` : '#'}
                    onClick={() => {
                      if (!n.read) markOneRead(n._id);
                      setOpen(false);
                    }}
                    className={`flex gap-3 px-4 py-3 border-b border-ink-800/60 last:border-0 hover:bg-ink-800/60 transition-colors ${
                      !n.read ? 'bg-violet-500/5' : ''
                    }`}
                  >
                    <Avatar user={n.sender} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-surface-50/90 leading-snug">{n.message}</p>
                      <p className="mt-0.5 text-xs text-surface-50/40">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
