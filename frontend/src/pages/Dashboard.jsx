import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi, taskApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';
import { PageLoader, EmptyState, ErrorState } from '../components/Feedback';
import Avatar from '../components/Avatar';
import { formatDate, isOverdue, PRIORITY_DOT, STATUS_STYLES } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await projectApi.list();
      setProjects(data.projects);
      const taskLists = await Promise.all(
        data.projects.map((p) =>
          taskApi
            .listByProject(p._id)
            .then((r) => r.data.tasks.map((t) => ({ ...t, projectName: p.name })))
            .catch(() => [])
        )
      );
      setTasks(taskLists.flat());
    } catch (err) {
      setError('Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myTasks = useMemo(() => tasks.filter((t) => t.assignedTo?._id === user?._id), [tasks, user]);
  const dueSoon = useMemo(() => {
    const now = Date.now();
    const soon = now + 3 * 86400000;
    return myTasks
      .filter((t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate).getTime() <= soon)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [myTasks]);
  const completed = myTasks.filter((t) => t.status === 'Completed');
  const recentActivity = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6),
    [tasks]
  );

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) return <PageLoader label="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-9 animate-fade-in">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-[1.75rem] text-surface-50">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-surface-50/45">Here's your work overview.</p>
        </div>
        <p className="text-xs text-surface-50/30">{today}</p>
      </div>

      {/* Flat stat row instead of four boxed cards — reads as a summary line, not a widget grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-ink-800 border-y border-ink-800">
        <Stat label="My projects" value={projects.length} />
        <Stat label="Assigned to me" value={myTasks.length} />
        <Stat label="Due soon" value={dueSoon.length} accent={dueSoon.length > 0 ? 'amber' : null} />
        <Stat label="Completed" value={completed.length} accent={completed.length > 0 ? 'green' : null} />
      </div>

      <div className="grid lg:grid-cols-3 gap-x-10 gap-y-9">
        <div className="lg:col-span-2 space-y-9">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-medium text-surface-50">My projects</h2>
              <Link to="/projects" className="text-xs font-medium text-violet-400 hover:text-violet-300">
                View all
              </Link>
            </div>
            {projects.length === 0 ? (
              <EmptyState
                compact
                title="No projects yet"
                description="Create your first project to start organizing work."
                action={
                  <Link to="/projects" className="btn-primary">
                    Create a project
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {projects.slice(0, 4).map((p) => (
                  <Link
                    key={p._id}
                    to={`/projects/${p._id}`}
                    className="rounded-lg border border-ink-800 p-4 hover:border-ink-600 hover:bg-ink-900/40 transition-colors"
                  >
                    <p className="text-sm font-medium text-surface-50 truncate">{p.name}</p>
                    <p className="mt-1 text-xs text-surface-50/40 line-clamp-2">{p.description || 'No description'}</p>
                    <div className="mt-3 flex -space-x-2">
                      {p.members.slice(0, 4).map((m) => (
                        <Avatar key={m.user._id} user={m.user} size="xs" />
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-surface-50 mb-4">Tasks due soon</h2>
            {dueSoon.length === 0 ? (
              <EmptyState compact title="Nothing due soon" description="You have no tasks due soon." />
            ) : (
              <div className="divide-y divide-ink-800 border-y border-ink-800">
                {dueSoon.map((t) => (
                  <Link key={t._id} to={`/tasks/${t._id}`} className="flex items-center gap-3 py-3 hover:bg-ink-900/40 transition-colors -mx-1 px-1">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                    <span className="flex-1 min-w-0 truncate text-sm text-surface-50/85">{t.title}</span>
                    <span className={`text-xs shrink-0 ${isOverdue(t.dueDate, t.status) ? 'text-red-400 font-medium' : 'text-surface-50/35'}`}>
                      {formatDate(t.dueDate)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium text-surface-50">Recent activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <EmptyState compact title="No activity yet" description="Task updates will show up here." />
          ) : (
            <div className="divide-y divide-ink-800 border-y border-ink-800">
              {recentActivity.map((t) => (
                <Link key={t._id} to={`/tasks/${t._id}`} className="block py-3 hover:bg-ink-900/40 transition-colors -mx-1 px-1">
                  <p className="text-sm text-surface-50/85 truncate">{t.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`chip ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                    <span className="text-xs text-surface-50/35 truncate">{t.projectName}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  const accentClass = accent === 'amber' ? 'text-amber-400' : accent === 'green' ? 'text-green-400' : 'text-surface-50';
  return (
    <div className="px-4 py-4 first:pl-0 sm:first:pl-0">
      <p className="text-xs text-surface-50/40">{label}</p>
      <p className={`mt-1.5 font-display text-[1.9rem] leading-none ${accentClass}`}>{value}</p>
    </div>
  );
}
