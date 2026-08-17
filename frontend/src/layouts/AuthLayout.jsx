import React from 'react';

export default function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.1fr_1fr] bg-ink-950">
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink-900 px-14 py-12 border-r border-ink-800">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(600px 380px at 12% 8%, rgba(110,86,207,0.14), transparent 60%), radial-gradient(500px 320px at 90% 85%, rgba(217,138,62,0.06), transparent 60%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-violet-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M9 16.5l4.5 4.5L23 11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-surface-50 tracking-tight">TaskFlow</span>
        </div>

        <div className="relative max-w-md">
          <p className="font-display text-[2.65rem] leading-[1.15] text-surface-50">
            Plan work. Assign tasks.
            <br />
            Ship together.
          </p>
          <p className="mt-5 text-surface-50/45 text-[15px] leading-relaxed">
            One place for your team's projects, tasks, and conversations —
            updated the moment something changes.
          </p>

          <ul className="mt-9 space-y-3.5 text-sm text-surface-50/55">
            <li className="flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-violet-400" />
              Project boards
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-violet-400" />
              Task assignments
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-violet-400" />
              Team activity
            </li>
          </ul>
        </div>

        <p className="relative text-xs text-surface-50/25">© {new Date().getFullYear()} TaskFlow</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-9 lg:hidden flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-violet-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M9 16.5l4.5 4.5L23 11" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[15px] font-semibold text-surface-50 tracking-tight">TaskFlow</span>
          </div>
          {eyebrow && (
            <p className="text-xs font-medium uppercase tracking-wide text-violet-400 mb-2">{eyebrow}</p>
          )}
          <h1 className="font-display text-[1.7rem] text-surface-50">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-surface-50/45">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
