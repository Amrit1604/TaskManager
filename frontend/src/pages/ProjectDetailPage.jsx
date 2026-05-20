/**
 * pages/ProjectDetailPage.jsx
 * View a single project: members list, tasks table, and task creation.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';
import { formatDate, isOverdue } from '../utils/helpers';
import { ArrowLeft, Plus, UserPlus, Users, Trash2, Kanban } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [users,   setUsers]   = useState([]);
  const [userId,  setUserId]  = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    usersAPI.list().then((r) => setUsers(r.data.users)).catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      await projectsAPI.addMember(projectId, parseInt(userId));
      toast.success('Member added');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Add Member" onClose={onClose}>
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label htmlFor="member-select">Select User</label>
          <select id="member-select" className="input" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">-- Choose a user --</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email}) — {u.role}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !userId}>
            {loading ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [project,     setProject]     = useState(null);
  const [tasks,       setTasks]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showTask,    setShowTask]    = useState(false);
  const [showMember,  setShowMember]  = useState(false);
  const [editTask,    setEditTask]    = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, taskRes] = await Promise.all([
        projectsAPI.get(id),
        tasksAPI.listByProject(id, {}),
      ]);
      setProject(projRes.data.project);
      setTasks(taskRes.data.tasks);
    } catch (err) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this project?`)) return;
    try {
      await projectsAPI.removeMember(id, memberId);
      toast.success('Member removed');
      fetchAll();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const filtered = filterStatus ? tasks.filter((t) => t.status === filterStatus) : tasks;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
    </div>
  );

  if (!project) return (
    <div className="card" style={{ padding: 60, textAlign: 'center' }}>
      <p style={{ color: 'var(--text-muted)' }}>Project not found or access denied.</p>
      <Link to="/projects" className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>Back to Projects</Link>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24 }}>
        <ArrowLeft size={14} /> Projects
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={`/kanban?project=${id}`} className="btn btn-ghost">
            <Kanban size={15} /> Kanban View
          </Link>
          {isAdmin && (
            <>
              <button className="btn btn-ghost" onClick={() => setShowMember(true)}>
                <UserPlus size={15} /> Add Member
              </button>
              <button className="btn btn-primary" onClick={() => setShowTask(true)}>
                <Plus size={15} /> New Task
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
        {/* Tasks */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600 }}>Tasks ({tasks.length})</span>
            <select className="input" style={{ width: 'auto' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No tasks yet{isAdmin ? ' — create one!' : ''}
                  </td></tr>
                ) : filtered.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className={overdue ? 'overdue' : ''}>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.description.slice(0, 50)}…</div>}
                      </td>
                      <td>{task.assignee_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td><StatusBadge status={task.status} /></td>
                      <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                        {overdue
                          ? <span style={{ color: 'var(--danger)' }}>⚠ {formatDate(task.due_date)}</span>
                          : formatDate(task.due_date)
                        }
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setEditTask(task)}>
                          {isAdmin ? 'Edit' : 'Update'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Members Panel */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Users size={16} color="var(--accent-light)" />
            <span style={{ fontWeight: 600 }}>Members ({project.members?.length || 0})</span>
          </div>
          {project.members?.map((member) => (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{member.role}</div>
              </div>
              {isAdmin && member.id !== user.id && (
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                  onClick={() => handleRemoveMember(member.id, member.name)} title="Remove member">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showTask  && <TaskModal projectId={id} onClose={() => setShowTask(false)} onSaved={fetchAll} />}
      {showMember && <AddMemberModal projectId={id} onClose={() => setShowMember(false)} onAdded={fetchAll} />}
      {editTask  && <TaskModal task={editTask} projectId={id} onClose={() => setEditTask(null)} onSaved={fetchAll} />}
    </div>
  );
}
