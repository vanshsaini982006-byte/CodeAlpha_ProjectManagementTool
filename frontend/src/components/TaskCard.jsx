import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import { formatDate, isOverdue, PRIORITY_DOT } from '../utils/format';

export default function TaskCard({ task, onDragStart, dragging }) {
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Link
      to={`/tasks/${task._id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      className={`block rounded-lg border border-ink-800 bg-ink-900/60 p-3 cursor-grab active:cursor-grabbing hover:border-ink-600 transition-colors ${
        dragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} title={task.priority} />
        <p className="text-sm text-surface-50/90 leading-snug">{task.title}</p>
      </div>

      {task.labels?.length > 0 && (
        <div className="mt-2 ml-3.5 flex flex-wrap gap-1.5">
          {task.labels.map((l) => (
            <span key={l} className="text-[11px] text-violet-300/80">
              #{l}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2.5 ml-3.5 flex items-center justify-between">
        {task.comments?.length > 0 ? (
          <span className="flex items-center gap-1 text-[11px] text-surface-50/35">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1-4.5a8.5 8.5 0 1 1 17-4z" />
            </svg>
            {task.comments.length}
          </span>
        ) : <span />}
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-[11px] ${overdue ? 'text-red-400 font-medium' : 'text-surface-50/35'}`}>
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.assignedTo && <Avatar user={task.assignedTo} size="xs" />}
        </div>
      </div>
    </Link>
  );
}
