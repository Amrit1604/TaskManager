/**
 * pages/ProjectDetailPage.jsx
 * Minimalist Monochrome Project Detail Page.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import TaskModal from '../components/TaskModal';
import Modal from '../components/Modal';
import { formatDate, isOverdue } from '../utils/helpers';
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
      toast.success('PERSONNEL ASSIGNED');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Assign Personnel" onClose={onClose}>
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <label htmlFor="member-select">Select Individual</label>
          <select id="member-select" className="input" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">-- Select --</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', borderTop: '2px solid var(--border)', paddingTop: 24 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Dismiss</button>
          <button type="submit" className="btn btn-primary" disabled={loading || !userId}>
            {loading ? 'Processing...' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
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
    if (!confirm(`Revoke access for ${memberName}?`)) return;
    try {
      await projectsAPI.removeMember(id, memberId);
      toast.success('ACCESS REVOKED');
      fetchAll();
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Are you sure you want to delete this project?`)) return;
    try {
      await projectsAPI.delete(id);
      toast.success('PROJECT ARCHIVED');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const filtered = filterStatus ? tasks.filter((t) => t.status === filterStatus) : tasks;

  const isAdminOrCreator = user?.role === 'admin' || project?.created_by === user?.id;

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
    </div>
  );

  if (!project) return (
    <div className="card texture-grid" style={{ padding: 120, textAlign: 'center', border: '4px solid var(--border)' }}>
      <h3 className="text-5xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>Not Found</h3>
      <Link to="/projects" className="btn btn-outline" style={{ marginTop: 32 }}>Return to Directory</Link>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Breadcrumb */}
      <Link to="/projects" style={{ display: 'inline-flex', fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--foreground)', textDecoration: 'none', marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
        ← Directory
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 40 }}>
        <div style={{ maxWidth: 800 }}>
          <h1 className="text-8xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 24, lineHeight: 1 }}>{project.name}</h1>
          <div className="rule-thick" style={{ width: 120, marginBottom: 24 }}></div>
          {project.description && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 24, lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
              {project.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignSelf: 'flex-end' }}>
          {isAdminOrCreator && (
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              Delete Project
            </button>
          )}
          <Link to={`/kanban?project=${id}`} className="btn btn-outline">
            Kanban View
          </Link>
          <button className="btn btn-outline" onClick={() => setShowMember(true)}>
            Add Personnel
          </button>
          <button className="btn btn-primary" onClick={() => setShowTask(true)}>
            Draft Task
          </button>
        </div>
      </div>

      <div className="rule-ultra" style={{ marginBottom: 64 }}></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 64, alignItems: 'start' }}>
        {/* Tasks */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="text-4xl" style={{ fontFamily: 'var(--font-serif)' }}>Register</h2>
            <select className="input" style={{ width: 'auto', border: '1px solid var(--border)' }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 64, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
                    Register is empty.
                  </td></tr>
                ) : filtered.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className={overdue ? 'overdue' : ''}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        {task.description && <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--muted-foreground)', marginTop: 4 }}>{task.description.slice(0, 50)}…</div>}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase' }}>
                        {task.assignee_name || '—'}
                      </td>
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td><StatusBadge status={task.status} /></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: overdue ? 700 : 400 }}>
                        {formatDate(task.due_date)}
                      </td>
                      <td>
                        <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => setEditTask(task)}>
                          Manage
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
        <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 40, marginLeft: -20 }}>
          <h2 className="text-3xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 24 }}>Personnel</h2>
          <div className="rule-thick" style={{ marginBottom: 24 }}></div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {project.members?.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.name}</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--muted-foreground)' }}>{member.role}</div>
                </div>
                {isAdminOrCreator && member.id !== user.id && (
                  <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }}
                    onClick={() => handleRemoveMember(member.id, member.name)}>
                    REVOKE
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showTask  && <TaskModal projectId={id} onClose={() => setShowTask(false)} onSaved={fetchAll} />}
      {showMember && <AddMemberModal projectId={id} onClose={() => setShowMember(false)} onAdded={fetchAll} />}
      {editTask  && <TaskModal task={editTask} projectId={id} onClose={() => setEditTask(null)} onSaved={fetchAll} />}
    </div>
  );
}
