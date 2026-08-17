import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { remember: true } });

  const onSubmit = async (values) => {
    setServerError('');
    const res = await login(values.email, values.password, values.remember);
    if (res.success) {
      const dest = location.state?.from?.pathname || '/dashboard';
      navigate(dest, { replace: true });
    } else {
      setServerError(res.message);
    }
  };

  return (
    <AuthLayout eyebrow="Welcome back" title="Log in to your workspace" subtitle="Pick up where your team left off.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-md border border-red-500/25 bg-red-500/[0.06] px-3.5 py-2.5 text-sm text-red-400">
            {serverError}
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@company.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium uppercase tracking-wide text-surface-50/45" htmlFor="password">Password</label>
            <button
              type="button"
              onClick={() => toast.info("Password reset isn't set up yet — contact your workspace admin.")}
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              placeholder="••••••••"
              {...register('password', { required: 'Password is required' })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-surface-50/35 hover:text-surface-50/70"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-surface-50/55 cursor-pointer select-none">
          <input
            type="checkbox"
            className="peer sr-only"
            {...register('remember')}
          />
          <span className="flex h-4 w-4 items-center justify-center rounded border border-ink-600 bg-ink-900 transition-colors peer-checked:bg-violet-500 peer-checked:border-violet-500">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="hidden peer-checked:block">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          Remember me
        </label>

        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-surface-50/45">
        New to TaskFlow?{' '}
        <Link to="/register" className="text-violet-400 font-medium hover:text-violet-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a20.3 20.3 0 015.06-5.94M9.9 4.24A10.4 10.4 0 0112 4c7 0 11 7 11 7a20.3 20.3 0 01-2.66 3.79M14.12 14.12a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1 1l22 22" strokeLinecap="round" />
    </svg>
  );
}
