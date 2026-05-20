/**
 * components/TaskModal.jsx
 * Minimalist Monochrome Task Modal.
 */
import { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '../api';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function TaskModal({ task, projectId, onClose, onSaved }) {
  const isEdit = !!task;
  const { user } = useAuth();
  
  const isAdminOrCreator = user?.role === 'admin' || true; // In the new RBAC, members can edit.

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee_id: task?.assignee_id || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    usersAPI.list().then((r) => setUsers(r.data.users)).catch(() => {});
  }, []);

  const fieldErr = (name) => errors.find((e) => e.field === name)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await tasksAPI.update(task.id, form);
        toast.success('TASK UPDATED');
      } else {
        await tasksAPI.create(projectId, form);
        toast.success('TASK DRAFTED');
      }
      onSaved();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setErrors(data.fields);
      else toast.error(data?.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('ARCHIVE TASK? This action removes it from the active ledger.')) return;
    try {
      await tasksAPI.delete(task.id);
      toast.success('TASK ARCHIVED');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to archive');
    }
  };

  return (
    <Modal title={isEdit ? 'Manage Task' : 'Draft Task'} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div>
          <label htmlFor="task-title">Nomenclature *</label>
          <input id="task-title" className="input" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Finalize copy" required />
          {fieldErr('title') && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, fontWeight: 700 }}>ERROR: {fieldErr('title')}</p>}
        </div>

        <div>
          <label htmlFor="task-desc">Details</label>
          <textarea id="task-desc" className="input" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Additional context..." rows={3} style={{ resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <label htmlFor="task-status">State</label>
            <select id="task-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label htmlFor="task-priority">Priority</label>
            <select id="task-priority" className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <label htmlFor="task-assignee">Assignee</label>
            <select id="task-assignee" className="input" value={form.assignee_id}
              onChange={(e) => setForm({ ...form, assignee_id: e.target.value })}>
              <option value="">-- Unassigned --</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            {fieldErr('assignee_id') && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, fontWeight: 700 }}>ERROR: {fieldErr('assignee_id')}</p>}
          </div>
          <div>
            <label htmlFor="task-due">Deadline</label>
            <input id="task-due" type="date" className="input" value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            {fieldErr('due_date') && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, fontWeight: 700 }}>ERROR: {fieldErr('due_date')}</p>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', borderTop: '2px solid var(--border)', paddingTop: 24, marginTop: 8 }}>
          {isEdit ? (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Archive
            </button>
          ) : <div />}
          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Dismiss</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isEdit ? 'Update' : 'Draft')}
            </button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
