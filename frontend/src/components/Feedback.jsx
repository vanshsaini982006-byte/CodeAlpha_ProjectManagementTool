import React from 'react';

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-surface-50/40">
      <Spinner size={22} />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon, title, description, action, compact = false }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10 px-4' : 'py-16 px-6'}`}>
      {icon && <div className="mb-3 text-surface-50/25">{icon}</div>}
      <p className="text-sm font-medium text-surface-50/80">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm text-surface-50/40">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-500/15 bg-red-500/[0.04] py-14 px-6 text-center">
      <p className="text-sm text-red-400">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
