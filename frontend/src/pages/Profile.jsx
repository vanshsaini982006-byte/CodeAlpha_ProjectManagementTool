import React from 'react';
import { useForm } from 'react-hook-form';
import { userApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      avatar: user?.avatar || '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const { data } = await userApi.updateProfile(values);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-xl animate-fade-in">
      <h1 className="font-display text-[1.75rem] text-surface-50">Profile</h1>
      <p className="mt-1 text-sm text-surface-50/45">Update your name, avatar, and bio.</p>

      <div className="mt-8 flex items-center gap-4 pb-7 border-b border-ink-800">
        <Avatar user={user} size="lg" />
        <div>
          <p className="flex items-center gap-2 font-medium text-surface-50">
            {user?.name}
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Active" />
          </p>
          <p className="text-sm text-surface-50/40">{user?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className="input" {...register('name', { required: 'Name is required' })} />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="username">Username</label>
          <input id="username" className="input" {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'At least 3 characters' } })} />
          {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="avatar">Avatar URL</label>
          <input id="avatar" className="input" placeholder="https://…" {...register('avatar')} />
        </div>
        <div>
          <label className="label" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            rows={4}
            className="input resize-none leading-relaxed"
            maxLength={300}
            placeholder="A short bio about you"
            {...register('bio')}
          />
        </div>
        <div className="flex justify-end pt-1">
          <button type="submit" className="btn-primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
