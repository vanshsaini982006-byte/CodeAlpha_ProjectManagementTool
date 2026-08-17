import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { projectApi, taskApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { PageLoader, ErrorState } from '../components/Feedback';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { COLUMNS } from '../utils/format';

export default function ProjectBoard() {
  const { id } = useParams();
  const { socket, joinProject, leaveProject } = useSocket();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({ open: false, task: null, defaultStatus: 'Backlog' });
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: projData }, { data: taskData }] = await Promise.all([
        projectApi.get(id),
        taskApi.listByProject(id),
      ]);
      setProject(projData.project);
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

  useEffect(() => {
    joinProject(id);
    return () => leaveProject(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, socket]);

  useEffect(() => {
    if (!socket) return;

    const upsert = (task) => setTasks((prev) => {
      const exists = prev.some((t) => t._id === task._id);
      return exists ? prev.map((t) => (t._id === task._id ? task : t)) : [...prev, task];
    });
    const onCreated = (task) => task.project?._id === id && upsert(task);
    const onUpdated = (task) => task.project?._id === id && upsert(task);
    const onMoved = (task) => task.project?._id === id && upsert(task);
    const onAssigned = (task) => task.project?._id === id && upsert(task);
    const onDeleted = ({ taskId, projectId }) => projectId === id && setTasks((prev) => prev.filter((t) => t._id !== taskId));
    const onCommentAdded = ({ taskId, comment }) =>
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t)));
    const onCommentDeleted = ({ taskId, commentId }) =>
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, comments: (t.comments || []).filter((c) => c._id !== commentId && c !== commentId) } : t)));
    const onMemberAdded = ({ project: p }) => p._id === id && setProject(p);
    const onMemberRemoved = ({ projectId }) => projectId === id && load();
    const onProjectUpdated = (p) => p._id === id && setProject(p);

    socket.on('taskCreated', onCreated);
    socket.on('taskUpdated', onUpdated);
    socket.on('taskMoved', onMoved);
    socket.on('taskAssigned', onAssigned);
    socket.on('taskDeleted', onDeleted);
    socket.on('commentAdded', onCommentAdded);
    socket.on('commentDeleted', onCommentDeleted);
    socket.on('memberAdded', onMemberAdded);
    socket.on('memberRemoved', onMemberRemoved);
    socket.on('projectUpdated', onProjectUpdated);

    return () => {
      socket.off('taskCreated', onCreated);
      socket.off('taskUpdated', onUpdated);
      socket.off('taskMoved', onMoved);
      socket.off('taskAssigned', onAssigned);
      socket.off('taskDeleted', onDeleted);
      socket.off('commentAdded', onCommentAdded);
      socket.off('commentDeleted', onCommentDeleted);
      socket.off('memberAdded', onMemberAdded);
      socket.off('memberRemoved', onMemberRemoved);
      socket.off('projectUpdated', onProjectUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, id]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c, []]));
    for (const t of tasks) {
      (map[t.status] || map.Backlog).push(t);
    }
    return map;
  }, [tasks]);

  const handleDragStart = (e, task) => {
    setDragTaskId(task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (status) => {
    setDragOverCol(null);
    if (!dragTaskId) return;
    const task = tasks.find((t) => t._id === dragTaskId);
    setDragTaskId(null);
    if (!task || task.status === status) return;

    const prevStatus = task.status;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await taskApi.updateStatus(task._id, { status });
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status: prevStatus } : t)));
      toast.error(getErrorMessage(err));
    }
  };

  const handleSaved = (task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t._id === task._id);
      return exists ? prev.map((t) => (t._id === task._id ? task : t)) : [...prev, task];
    });
    setModalState({ open: false, task: null, defaultStatus: 'Backlog' });
  };

  if (loading) return <PageLoader label="Loading board…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!project) return null;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)]">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/projects/${id}`} className="text-xs text-surface-50/40 hover:text-surface-50">{project.name}</Link>
            <span className="text-surface-50/20">/</span>
            <span className="text-xs text-surface-50/40">Board</span>
          </div>
          <h1 className="font-display text-xl text-surface-50 mt-1 truncate">Board</h1>
        </div>
        <button className="btn-primary" onClick={() => setModalState({ open: true, task: null, defaultStatus: 'Backlog' })}>
          <PlusIcon /> New task
        </button>
      </div>

      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === col ? null : c))}
            onDrop={() => handleDrop(col)}
            className={`flex w-72 shrink-0 flex-col rounded-lg border transition-colors ${
              dragOverCol === col ? 'border-violet-400/50 bg-violet-500/[0.04]' : 'border-ink-800 bg-ink-900/30'
            }`}
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-surface-50/80">{col}</span>
                <span className="text-[11px] text-surface-50/35">{grouped[col].length}</span>
              </div>
              <button
                onClick={() => setModalState({ open: true, task: null, defaultStatus: col })}
                aria-label={`Add task to ${col}`}
                className="rounded p-1 text-surface-50/30 hover:text-surface-50 hover:bg-ink-800"
              >
                <PlusIcon size={14} />
              </button>
            </div>
            <div className="flex-1 min-h-[4rem] space-y-2 overflow-y-auto px-2.5 pb-2.5">
              {grouped[col].map((task) => (
                <TaskCard key={task._id} task={task} onDragStart={handleDragStart} dragging={dragTaskId === task._id} />
              ))}
              {grouped[col].length === 0 && (
                <div className="rounded-lg border border-dashed border-ink-800 py-7 text-center text-xs text-surface-50/25">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, task: null, defaultStatus: 'Backlog' })}
        projectId={id}
        members={project.members}
        task={modalState.task}
        defaultStatus={modalState.defaultStatus}
        onSaved={handleSaved}
      />
    </div>
  );
}

function PlusIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
