import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { taskApi, commentApi, projectApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { PageLoader, ErrorState } from '../components/Feedback';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import TaskModal from '../components/TaskModal';
import { formatDateTime, isOverdue, PRIORITY_DOT, PRIORITY_TEXT, STATUS_STYLES, COLUMNS, timeAgo } from '../utils/format';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, joinProject, leaveProject } = useSocket();
  const toast = useToast();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const commentsEndRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await taskApi.get(id);
      setTask(data.task);
      setComments(data.comments);
      const { data: projData } = await projectApi.get(data.task.project._id);
      setProject(projData.project);
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
    if (!task?.project?._id) return;
    joinProject(task.project._id);
    return () => leaveProject(task.project._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.project?._id, socket]);

  useEffect(() => {
    if (!socket) return;
    const onCommentAdded = ({ taskId, comment }) => {
      if (taskId !== id) return;
      setComments((prev) => (prev.some((c) => c._id === comment._id) ? prev : [...prev, comment]));
    };
    const onCommentUpdated = ({ taskId, comment }) => {
      if (taskId !== id) return;
      setComments((prev) => prev.map((c) => (c._id === comment._id ? comment : c)));
    };
    const onCommentDeleted = ({ taskId, commentId }) => {
      if (taskId !== id) return;
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    };
    const onTaskUpdated = (updated) => updated._id === id && setTask(updated);
    const onTaskMoved = (updated) => updated._id === id && setTask(updated);
    const onTaskDeleted = ({ taskId }) => {
      if (taskId === id) {
        toast.info('This task was deleted');
        navigate(`/projects/${task?.project?._id || ''}`);
      }
    };

    socket.on('commentAdded', onCommentAdded);
    socket.on('commentUpdated', onCommentUpdated);
    socket.on('commentDeleted', onCommentDeleted);
    socket.on('taskUpdated', onTaskUpdated);
    socket.on('taskMoved', onTaskMoved);
    socket.on('taskDeleted', onTaskDeleted);

    return () => {
      socket.off('commentAdded', onCommentAdded);
      socket.off('commentUpdated', onCommentUpdated);
      socket.off('commentDeleted', onCommentDeleted);
      socket.off('taskUpdated', onTaskUpdated);
      socket.off('taskMoved', onTaskMoved);
      socket.off('taskDeleted', onTaskDeleted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [comments.length]);

  const postComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const { data } = await commentApi.create(id, { content: commentText.trim() });
      setComments((prev) => (prev.some((c) => c._id === data.comment._id) ? prev : [...prev, data.comment]));
      setCommentText('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const saveEditedComment = async (commentId) => {
    if (!editingText.trim()) return;
    try {
      const { data } = await commentApi.update(commentId, { content: editingText.trim() });
      setComments((prev) => prev.map((c) => (c._id === commentId ? data.comment : c)));
      setEditingCommentId(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const deleteCommentNow = async (commentId) => {
    try {
      await commentApi.remove(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const quickUpdateStatus = async (status) => {
    const prev = task.status;
    setTask((t) => ({ ...t, status }));
    try {
      const { data } = await taskApi.updateStatus(id, { status });
      setTask(data.task);
    } catch (err) {
      setTask((t) => ({ ...t, status: prev }));
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteTask = async () => {
    setDeleting(true);
    try {
      await taskApi.remove(id);
      toast.success('Task deleted');
      navigate(`/projects/${task.project._id}/board`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading task…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!task) return null;

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-1.5 mb-5">
        <Link to={`/projects/${task.project._id}/board`} className="text-xs text-surface-50/35 hover:text-surface-50/70">
          {task.project.name}
        </Link>
        <span className="text-surface-50/20">/</span>
        <span className="text-xs text-surface-50/35">Task</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl text-surface-50">{task.title}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-secondary !px-3 !py-1.5 text-xs" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn-danger !px-3 !py-1.5 text-xs" onClick={() => setShowDelete(true)}>Delete</button>
        </div>
      </div>

      {task.description && <p className="mt-3 text-sm text-surface-50/65 leading-relaxed whitespace-pre-wrap">{task.description}</p>}

      <div className="mt-6 grid sm:grid-cols-2 gap-x-6 gap-y-4 py-5 border-y border-ink-800">
        <div>
          <p className="label">Status</p>
          <select
            value={task.status}
            onChange={(e) => quickUpdateStatus(e.target.value)}
            className={`rounded px-2 py-1 text-[13px] font-medium border border-ink-700 ${STATUS_STYLES[task.status]}`}
          >
            {COLUMNS.map((c) => (
              <option key={c} value={c} className="bg-ink-900 text-surface-50">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="label">Priority</p>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${PRIORITY_TEXT[task.priority]}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
            {task.priority}
          </span>
        </div>
        <div>
          <p className="label">Assignee</p>
          {task.assignedTo ? (
            <div className="flex items-center gap-2">
              <Avatar user={task.assignedTo} size="xs" />
              <span className="text-sm text-surface-50/85">{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="text-sm text-surface-50/35">Unassigned</span>
          )}
        </div>
        <div>
          <p className="label">Due date</p>
          <span className={`text-sm ${overdue ? 'text-red-400 font-medium' : 'text-surface-50/85'}`}>
            {task.dueDate ? formatDateTime(task.dueDate) : 'No due date'}
            {overdue && ' · Overdue'}
          </span>
        </div>
      </div>

      {task.labels?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
          {task.labels.map((l) => (
            <span key={l} className="text-xs text-violet-300/80">#{l}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-surface-50/35">
        <span>Created by {task.createdBy?.name} · {formatDateTime(task.createdAt)}</span>
        <span>Updated {timeAgo(task.updatedAt)}</span>
      </div>

      <div className="mt-9">
        <h2 className="text-[15px] font-medium text-surface-50 mb-4">Comments ({comments.length})</h2>

        <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
          {comments.length === 0 && <p className="text-sm text-surface-50/35">No comments yet. Start the conversation.</p>}
          {comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <Avatar user={c.user} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-50/90">{c.user?.name}</span>
                  <span className="text-xs text-surface-50/35">{timeAgo(c.createdAt)}</span>
                  {c.updatedAt !== c.createdAt && <span className="text-xs text-surface-50/25">(edited)</span>}
                </div>
                {editingCommentId === c._id ? (
                  <div className="mt-1.5 space-y-2">
                    <textarea
                      className="input resize-none"
                      rows={2}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => saveEditedComment(c._id)}>Save</button>
                      <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => setEditingCommentId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm text-surface-50/75 whitespace-pre-wrap">{c.content}</p>
                )}
                {c.user?._id === user?._id && editingCommentId !== c._id && (
                  <div className="mt-1 flex gap-3">
                    <button
                      className="text-xs text-surface-50/35 hover:text-violet-400"
                      onClick={() => {
                        setEditingCommentId(c._id);
                        setEditingText(c.content);
                      }}
                    >
                      Edit
                    </button>
                    <button className="text-xs text-surface-50/35 hover:text-red-400" onClick={() => deleteCommentNow(c._id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        <form onSubmit={postComment} className="mt-5 flex gap-2 items-start pt-5 border-t border-ink-800">
          <Avatar user={user} size="sm" />
          <textarea
            className="input resize-none flex-1"
            rows={2}
            placeholder="Write a comment…"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                postComment(e);
              }
            }}
          />
          <button className="btn-primary shrink-0" disabled={posting || !commentText.trim()}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>

      {project && (
        <TaskModal
          open={showEdit}
          onClose={() => setShowEdit(false)}
          projectId={task.project._id}
          members={project.members}
          task={task}
          onSaved={(updated) => {
            setTask((prev) => ({ ...prev, ...updated }));
            setShowEdit(false);
          }}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteTask}
        loading={deleting}
        title="Delete this task?"
        message="This permanently deletes the task and all of its comments. This cannot be undone."
        confirmLabel="Delete task"
      />
    </div>
  );
}
