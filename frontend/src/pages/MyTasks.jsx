import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectApi, taskApi } from '../services/resources';
import { useAuth } from '../context/AuthContext';
import { PageLoader, EmptyState, ErrorState } from '../components/Feedback';
import { formatDate, isOverdue, PRIORITY_DOT, PRIORITY_TEXT } from '../utils/format';

const FILTERS = ['All', 'To Do', 'In Progress', 'Review', 'Completed'];

export default function MyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await projectApi.list();
      const lists = await Promise.all(
        data.projects.map((p) =>
          taskApi
            .listByProject(p._id)
            .then((r) => r.data.tasks.map((t) => ({ ...t, projectName: p.name, projectId: p._id })))
            .catch(() => [])
        )
      );
      setTasks(lists.flat().filter((t) => t.assignedTo?._id === user?._id));
    } catch (err) {
      setError('Could not load your tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const list = filter === 'All' ? tasks : tasks.filter((t) => t.status === filter);
    return [...list].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [tasks, filter]);

  if (loading) return <PageLoader label="Loading your tasks…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="animate-fade-in">
      <div>
        <h1 className="font-display text-[1.75rem] text-surface-50">My Tasks</h1>
        <p className="mt-1 text-sm text-surface-50/45">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''} assigned to you
        </p>
      </div>

      <div className="mt-6 -mx-1 overflow-x-auto">
        <div className="inline-flex items-center rounded-md bg-ink-900 border border-ink-800 p-0.5 mx-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded px-3 py-1.5 text-[13px] font-medium transition-colors ${
                filter === f ? 'bg-ink-700 text-surface-50' : 'text-surface-50/50 hover:text-surface-50/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState title="No tasks here" description="Tasks assigned to you will show up in this list." />
        ) : (
          <div className="divide-y divide-ink-800 border-y border-ink-800">
            {filtered.map((t) => (
              <Link key={t._id} to={`/tasks/${t._id}`} className="flex items-center gap-3 py-3.5 hover:bg-ink-900/40 transition-colors -mx-1 px-1">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} title={t.priority} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-surface-50/90">{t.title}</p>
                  <p className="truncate text-xs text-surface-50/40">{t.projectName}</p>
                </div>
                <span className={`hidden sm:inline text-xs font-medium ${PRIORITY_TEXT[t.priority]}`}>{t.priority}</span>
                {t.dueDate && (
                  <span className={`text-xs shrink-0 w-20 text-right ${isOverdue(t.dueDate, t.status) ? 'text-red-400 font-medium' : 'text-surface-50/40'}`}>
                    {formatDate(t.dueDate)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
