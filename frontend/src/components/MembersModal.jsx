import React, { useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { projectApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ROLE_STYLES } from '../utils/format';

export default function MembersModal({ open, onClose, project, onUpdated, canManage }) {
  const { user } = useAuth();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('Member');
  const [inviting, setInviting] = useState(false);

  const invite = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setInviting(true);
    try {
      const payload = identifier.includes('@') ? { email: identifier.trim() } : { username: identifier.trim() };
      const { data } = await projectApi.addMember(project._id, { ...payload, role });
      onUpdated(data.project);
      setIdentifier('');
      toast.success('Member added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  const remove = async (userId) => {
    try {
      const { data } = await projectApi.removeMember(project._id, userId);
      onUpdated(data.project);
      toast.success('Member removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!project) return null;

  return (
    <Modal open={open} onClose={onClose} title="Project members" width="max-w-lg">
      {canManage && (
        <form onSubmit={invite} className="flex flex-col sm:flex-row gap-2 mb-5">
          <input
            className="input flex-1"
            placeholder="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <select className="input sm:w-32" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </select>
          <button className="btn-primary shrink-0" disabled={inviting}>
            {inviting ? 'Adding…' : 'Invite'}
          </button>
        </form>
      )}

      <div className="space-y-1">
        {project.members.map((m) => (
          <div key={m.user._id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-ink-800/60">
            <Avatar user={m.user} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-surface-50">
                {m.user.name} {m.user._id === user?._id && <span className="text-surface-50/40">(you)</span>}
              </p>
              <p className="truncate text-xs text-surface-50/40">{m.user.email}</p>
            </div>
            <span className={`chip ${ROLE_STYLES[m.role]}`}>{m.role}</span>
            {canManage && m.role !== 'Owner' && (
              <button
                onClick={() => remove(m.user._id)}
                className="rounded p-1 text-surface-50/30 hover:text-red-400 hover:bg-red-500/10"
                aria-label={`Remove ${m.user.name}`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
