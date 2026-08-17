import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { projectApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { PageLoader, EmptyState, ErrorState } from '../components/Feedback';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import { useToast } from '../context/ToastContext';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await projectApi.list();
      setProjects(data.projects);
    } catch (err) {
      setError('Could not load your projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreated = (project) => {
    setProjects((prev) => [project, ...prev]);
    setShowCreate(false);
    toast.success('Project created');
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] text-surface-50">My Projects</h1>
          <p className="mt-1 text-sm text-surface-50/45">
            {projects.length > 0 ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : 'Group tasks and members into projects.'}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <PlusIcon /> New project
        </button>
      </div>

      <div className="mt-7">
        {loading ? (
          <PageLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Projects group your tasks, members, and boards together. Create one to get started."
            action={
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                Create your first project
              </button>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Link
                key={p._id}
                to={`/projects/${p._id}`}
                className="rounded-lg border border-ink-800 p-5 hover:border-ink-600 hover:bg-ink-900/40 transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-medium text-surface-50 truncate">{p.name}</h3>
                  <span className={`chip shrink-0 ${statusChip(p.status)}`}>{p.status}</span>
                </div>
                <p className="mt-2 text-sm text-surface-50/45 line-clamp-2 flex-1">{p.description || 'No description yet.'}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {p.members.slice(0, 5).map((m) => (
                      <Avatar key={m.user._id} user={m.user} size="xs" />
                    ))}
                  </div>
                  <span className="text-xs text-surface-50/35">
                    {p.members.length} member{p.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </div>
  );
}

function statusChip(status) {
  switch (status) {
    case 'Active':
      return 'bg-green-500/12 text-green-400';
    case 'On Hold':
      return 'bg-amber-500/12 text-amber-400';
    case 'Completed':
      return 'bg-violet-500/12 text-violet-300';
    default:
      return 'bg-ink-800 text-surface-50/50';
  }
}

function CreateProjectModal({ open, onClose, onCreated }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const toast = useToast();

  const onSubmit = async (values) => {
    try {
      const { data } = await projectApi.create(values);
      reset();
      onCreated(data.project);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a project">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Project name</label>
          <input id="name" className="input" placeholder="Website redesign" {...register('name', { required: 'Project name is required' })} />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={3} className="input resize-none" placeholder="What is this project about?" {...register('description')} />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
