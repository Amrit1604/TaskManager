/**
 * components/TaskModal.jsx
 * Create / Edit task form. Admin sees all fields. Member only sees status.
 */
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY = { title: '', description: '', assignee_id: '', priority: 'medium', status: 'todo', due_date: '' };

export default function TaskModal({ projectId, task, onClose, onSaved }) {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';
  const isEdit   = !!task;

  const [form,    setForm]    = useState(isEdit ? {
    title: task.title, description: task.description || '',
    assignee_id: task.assignee_id || '', priority: task.priority,
    status: task.status, due_date: task.due_date ? task.due_date.split('T')[0] : '',
  } : EMPTY);
  const [members, setMembers] = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState([]);

  // Load project members for assignee picker
  useEffect(() => {
    if (isAdmin && projectId) {
      usersAPI.list().then((r) => setMembers(r.data.users)).catch(() => {});
    }
  }, [isAdmin, projectId]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const fieldErr = (name) => errors.find((e) => e.field === name)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      const payload = isAdmin ? form : { status: form.status };
      if (isEdit) {
        await tasksAPI.update(task.id, payload);
        toast.success('Task updated');
      } else {
        await tasksAPI.create(projectId, { ...form, assignee_id: form.assignee_id || null });
        toast.success('Task created');
      }
      onSaved();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setErrors(data.fields);
      else toast.error(data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (name) => ({ borderColor: fieldErr(name) ? 'var(--danger)' : undefined });

  return (
    <Modal title={isEdit ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {isAdmin && (
          <>
            <div>
              <label htmlFor="task-title">Title *</label>
              <input id="task-title" className="input" value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="Task title" style={inputStyle('title')} required />
              {fieldErr('title') && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{fieldErr('title')}</p>}
            </div>

            <div>
              <label htmlFor="task-desc">Description</label>
              <textarea id="task-desc" className="input" value={form.description} onChange={(e) => set('description', e.target.value)}
                placeholder="Optional description…" rows={3} style={{ resize: 'vertical', ...inputStyle('description') }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label htmlFor="task-priority">Priority</label>
                <select id="task-priority" className="input" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="task-due">Due Date</label>
                <input id="task-due" type="date" className="input" value={form.due_date}
                  onChange={(e) => set('due_date', e.target.value)} />
              </div>
            </div>

            <div>
              <label htmlFor="task-assignee">Assignee</label>
              <select id="task-assignee" className="input" value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
              </select>
            </div>
          </>
        )}

        <div>
          <label htmlFor="task-status">Status</label>
          <select id="task-status" className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
