import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import { taskApi } from '../services/resources';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { COLUMNS } from '../utils/format';

// task: null for create mode, task object for edit mode
export default function TaskModal({ open, onClose, projectId, members, task, defaultStatus, onSaved }) {
  const toast = useToast();
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState([]);
  const isEdit = !!task;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title || '',
        description: task?.description || '',
        status: task?.status || defaultStatus || 'Backlog',
        priority: task?.priority || 'Medium',
        dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
        assignedTo: task?.assignedTo?._id || '',
      });
      setLabels(task?.labels || []);
      setLabelInput('');
    }
  }, [open, task, defaultStatus, reset]);

  const addLabel = () => {
    const val = labelInput.trim();
    if (val && !labels.includes(val)) setLabels((prev) => [...prev, val]);
    setLabelInput('');
  };

  const removeLabel = (l) => setLabels((prev) => prev.filter((x) => x !== l));

  const onSubmit = async (values) => {
    const payload = {
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
      assignedTo: values.assignedTo || null,
      labels,
    };
    try {
      let saved;
      if (isEdit) {
        const { data } = await taskApi.update(task._id, payload);
        saved = data.task;
        toast.success('Task updated');
      } else {
        const { data } = await taskApi.create(projectId, payload);
        saved = data.task;
        toast.success('Task created');
      }
      onSaved(saved);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'Create task'} width="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" className="input" placeholder="e.g. Design the landing page hero" {...register('title', { required: 'Title is required' })} />
          {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" rows={3} className="input resize-none" placeholder="Add more detail…" {...register('description')} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="status">Status</label>
            <select id="status" className="input" {...register('status')}>
              {COLUMNS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="priority">Priority</label>
            <select id="priority" className="input" {...register('priority')}>
              {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="dueDate">Due date</label>
            <input id="dueDate" type="date" className="input" {...register('dueDate')} />
          </div>
          <div>
            <label className="label" htmlFor="assignedTo">Assignee</label>
            <select id="assignedTo" className="input" {...register('assignedTo')}>
              <option value="">Unassigned</option>
              {members?.map((m) => (
                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Labels</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {labels.map((l) => (
              <span key={l} className="chip bg-violet-500/10 text-violet-300 gap-1.5">
                {l}
                <button type="button" onClick={() => removeLabel(l)} className="hover:text-violet-100">
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="Add a label and press Enter"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLabel();
                }
              }}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={addLabel}>Add</button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
