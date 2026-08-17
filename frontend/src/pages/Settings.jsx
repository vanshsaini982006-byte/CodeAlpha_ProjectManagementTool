import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-xl animate-fade-in">
      <h1 className="font-display text-[1.75rem] text-surface-50">Settings</h1>
      <p className="mt-1 text-sm text-surface-50/45">Manage your account and connection preferences.</p>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-surface-50/40 mb-3">Account</h2>
        <div className="divide-y divide-ink-800 border-y border-ink-800">
          <SettingRow label="Email" value={user?.email} />
          <SettingRow label="Username" value={`@${user?.username}`} />
          <SettingRow
            label="Real-time connection"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            }
          />
          <SettingRow label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
        </div>
      </section>

      <section className="mt-9">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-surface-50/40 mb-3">Notifications</h2>
        <div className="flex items-start gap-3 py-1">
          <span className="mt-0.5 text-surface-50/30">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-sm text-surface-50/55 leading-relaxed">
            Get notified about new assignments, project updates, comments, and upcoming deadlines.
          </p>
        </div>
      </section>

      <section className="mt-9 pt-7 border-t border-ink-800">
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-surface-50/40 mb-3">Session</h2>
        <p className="text-sm text-surface-50/45 mb-4">Log out of TaskFlow on this device.</p>
        <button className="btn-danger" onClick={() => setShowLogoutConfirm(true)}>
          Log out
        </button>
      </section>

      <ConfirmDialog
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Log out of TaskFlow?"
        message="You'll need to log back in to access your projects and tasks."
        confirmLabel="Log out"
      />
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div className="grid sm:grid-cols-[10rem_1fr] gap-x-4 gap-y-0.5 py-3.5">
      <span className="text-sm text-surface-50/45">{label}</span>
      <span className="text-sm font-medium text-surface-50/90">{value}</span>
    </div>
  );
}
