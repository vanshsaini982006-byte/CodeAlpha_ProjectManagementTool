import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AuthLayout from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setServerError('');
    const res = await registerUser({
      name: values.name,
      username: values.username.toLowerCase().replace(/\s+/g, ''),
      email: values.email,
      password: values.password,
    });
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setServerError(res.message);
    }
  };

  return (
    <AuthLayout eyebrow="Get started" title="Create your account" subtitle="Set up projects, invite your team, and start shipping.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="rounded-md border border-red-500/25 bg-red-500/[0.06] px-3.5 py-2.5 text-sm text-red-400">
            {serverError}
          </div>
        )}
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" placeholder="Jordan Rivera" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input
            id="username"
            className="input"
            placeholder="jordanr"
            {...register('username', {
              required: 'Username is required',
              minLength: { value: 3, message: 'At least 3 characters' },
            })}
          />
          {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
        </div>
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
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              placeholder="At least 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-surface-50/35 hover:text-surface-50/70"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            className="input"
            placeholder="Re-enter password"
            {...register('confirm', {
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
          />
          {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-surface-50/45">
        Already have an account?{' '}
        <Link to="/login" className="text-violet-400 font-medium hover:text-violet-300">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
