export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

const AVATAR_PALETTE = ['#6E56CF', '#D98A3E', '#3E9E74', '#4C7FD9', '#B0589E', '#5FA8BE'];

export const avatarColor = (seed = '') => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [label, secs] of units) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${label}${val > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'Completed') return false;
  return new Date(dueDate) < new Date();
};

// Priority is shown as a small colored dot + label rather than a filled pill,
// so it reads as data rather than decoration.
export const PRIORITY_DOT = {
  Low: 'bg-surface-50/30',
  Medium: 'bg-violet-400',
  High: 'bg-amber-400',
  Urgent: 'bg-red-400',
};

export const PRIORITY_TEXT = {
  Low: 'text-surface-50/50',
  Medium: 'text-violet-300',
  High: 'text-amber-400',
  Urgent: 'text-red-400',
};

export const STATUS_STYLES = {
  Backlog: 'bg-ink-800 text-surface-50/55',
  'To Do': 'bg-violet-500/12 text-violet-300',
  'In Progress': 'bg-amber-500/12 text-amber-400',
  Review: 'bg-sky-500/12 text-sky-300',
  Completed: 'bg-green-500/12 text-green-400',
};

export const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];

export const ROLE_STYLES = {
  Owner: 'bg-violet-500/12 text-violet-300',
  Admin: 'bg-amber-500/12 text-amber-400',
  Member: 'bg-ink-800 text-surface-50/55',
};
