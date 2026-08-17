import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectApi, taskApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader, ErrorState, EmptyState } from '../components/Feedback';
import Avatar from '../components/Avatar';
import MembersModal from '../components/MembersModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, isOverdue, PRIORITY_DOT, ROLE_STYLES } from '../utils/format';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: projData }, { data: taskData }] = await Promise.all([
        projectApi.get(id),
        taskApi.listByProject(id),
      ]);
      setProject(projData.project);
      setStats(projData.stats);
      setTasks(taskData.tasks);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <PageLoader label="Loading project…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!project) return null;

  const myRole = project.members.find((m) => m.user._id === user?._id)?.role;
  const canManage = myRole === 'Owner' || myRole === 'Admin';

  const recentTasks = [...tasks].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await projectApi.remove(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Link to="/projects" className="text-xs text-surface-50/35 hover:text-surface-50/70">Projects</Link>
            <span className="text-surface-50/20">/</span>
            <span className="text-xs text-surface-50/35">{project.name}</span>
          </div>
          <h1 className="font-display text-[1.75rem] text-surface-50 mt-1 truncate">{project.name}</h1>
          {project.description && <p className="mt-1.5 text-sm text-surface-50/45 max-w-2xl">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setShowMembers(true)}>
            <div className="flex -space-x-1.5 mr-1">
              {project.members.slice(0, 3).map((m) => (
                <Avatar key={m.user._id} user={m.user} size="xs" />
              ))}
            </div>
            Members
          </button>
          <Link to={`/projects/${id}/board`} className="btn-primary">Open board</Link>
          {myRole === 'Owner' && (
            <button className="btn-danger" onClick={() => setShowDelete(true)}>Delete</button>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-ink-800 border-y border-ink-800">
        <Stat label="Total tasks" value={stats.total} />
        <Stat label="In progress" value={stats.inProgress} accent="violet" />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Completed" value={stats.completed} accent="green" />
        <Stat label="Overdue" value={stats.overdue} accent="red" />
      </div>

      <div className="mt-9 grid lg:grid-cols-3 gap-x-10 gap-y-9">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-medium text-surface-50">Recent activity</h2>
            <Link to={`/projects/${id}/board`} className="text-xs font-medium text-violet-400 hover:text-violet-300">
              View board
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <EmptyState
              title="No tasks yet"
              description="Open the board to create your first task."
              action={<Link to={`/projects/${id}/board`} className="btn-primary">Open board</Link>}
            />
          ) : (
            <div className="divide-y divide-ink-800 border-y border-ink-800">
              {recentTasks.map((t) => (
                <Link key={t._id} to={`/tasks/${t._id}`} className="flex items-center gap-3 py-3.5 hover:bg-ink-900/40 transition-colors -mx-1 px-1">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} title={t.priority} />
                  <span className="flex-1 min-w-0 truncate text-sm text-surface-50/85">{t.title}</span>
                  {t.assignedTo && <Avatar user={t.assignedTo} size="xs" />}
                  {t.dueDate && (
                    <span className={`text-xs shrink-0 ${isOverdue(t.dueDate, t.status) ? 'text-red-400' : 'text-surface-50/35'}`}>
                      {formatDate(t.dueDate)}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-[15px] font-medium text-surface-50 mb-4">Team</h2>
          <div className="divide-y divide-ink-800 border-y border-ink-800">
            {project.members.map((m) => (
              <div key={m.user._id} className="flex items-center gap-3 py-3">
                <Avatar user={m.user} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-surface-50/90">{m.user.name}</p>
                  <p className="truncate text-xs text-surface-50/40">@{m.user.username}</p>
                </div>
                <span className={`chip ${ROLE_STYLES[m.role]}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MembersModal
        open={showMembers}
        onClose={() => setShowMembers(false)}
        project={project}
        canManage={canManage}
        onUpdated={(p) => setProject(p)}
      />
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this project?"
        message="This permanently deletes the project and all of its tasks and comments. This cannot be undone."
        confirmLabel="Delete project"
      />
    </div>
  );
}

function Stat({ label, value, accent }) {
  const accentClass =
    accent === 'red' ? 'text-red-400' : accent === 'green' ? 'text-green-400' : accent === 'violet' ? 'text-violet-300' : 'text-surface-50';
  return (
    <div className="px-4 py-4 first:pl-0 sm:first:pl-0">
      <p className="text-xs text-surface-50/40">{label}</p>
      <p className={`mt-1.5 font-display text-2xl ${accentClass}`}>{value}</p>
    </div>
  );
}
