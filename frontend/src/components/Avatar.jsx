import React from 'react';
import { initials, avatarColor } from '../utils/format';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export default function Avatar({ user, size = 'sm', className = '' }) {
  const name = user?.name || user?.username || '?';
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover ring-2 ring-ink-900 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${SIZES[size]} ${className} flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-ink-900 shrink-0`}
      style={{ backgroundColor: avatarColor(name) }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
