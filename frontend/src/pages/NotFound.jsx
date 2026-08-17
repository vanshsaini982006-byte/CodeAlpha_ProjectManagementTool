import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink-950 text-center px-6">
      <p className="font-display text-6xl font-semibold text-violet-400">404</p>
      <h1 className="mt-3 text-lg font-semibold text-surface-50">This page doesn't exist</h1>
      <p className="mt-1.5 text-sm text-surface-50/50">The link may be broken, or the page may have moved.</p>
      <Link to="/dashboard" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
