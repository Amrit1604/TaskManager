/**
 * pages/DashboardPage.jsx
 * Stat cards (total, by status, overdue) + filterable task table.
 * Admin sees global stats; Member sees their assigned tasks.
 */
import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import TaskModal from '../components/TaskModal';
import { isOverdue, formatDate, STATUS_LABELS, PRIORITY_LABELS } from '../utils/helpers';
import { LayoutDashboard, AlertCircle, Clock, CheckCircle2, ListTodo, Plus, Filter } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, glow }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${color}20` }}>
        <Icon size={20} color={color} />
      </div>
      <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 100, height: 100,
        borderRadius: '50%', background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [stats,     setStats]     = useState(null);
  const [tasks,     setTasks]     = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editTask,  setEditTask]  = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterProject,  setFilterProject]  = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, projRes] = await Promise.all([
        tasksAPI.getDashboard(),
        projectsAPI.list(),
      ]);
      if (isAdmin) {
        setStats(dashRes.data.stats);
        // Also load all tasks across all projects for admin table
        const allTasks = await Promise.all(
          projRes.data.projects.map((p) => tasksAPI.listByProject(p.id).then((r) => r.data.tasks))
        );
        setTasks(allTasks.flat());
      } else {
        setTasks(dashRes.data.tasks || []);
        // Compute member stats from their tasks
        const t = dashRes.data.tasks || [];
        setStats({
          total: t.length,
          todo: t.filter((x) => x.status === 'todo').length,
          in_progress: t.filter((x) => x.status === 'in_progress').length,
          done: t.filter((x) => x.status === 'done').length,
          overdue: t.filter(isOverdue).length,
        });
      }
      setProjects(projRes.data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filtered tasks
  const filtered = tasks.filter((t) => {
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject  && String(t.project_id) !== filterProject) return false;
    return true;
  });

  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <LayoutDashboard size={22} color="var(--accent-light)" />
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Dashboard</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          {isAdmin ? 'Overview of all tasks across all projects' : 'Your assigned tasks'}
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Total Tasks"   value={stats?.total}       icon={ListTodo}    color="var(--accent-light)" />
          <StatCard label="To Do"         value={stats?.todo}        icon={Clock}       color="#94a3b8" />
          <StatCard label="In Progress"   value={stats?.in_progress} icon={AlertCircle} color="var(--info)" />
          <StatCard label="Completed"     value={stats?.done}        icon={CheckCircle2}color="var(--success)" />
          <StatCard label="Overdue"       value={stats?.overdue}     icon={AlertCircle} color="var(--danger)" />
        </div>
      )}

      {/* Filters + Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Filters:</span>

          <select className="input" style={{ width: 'auto', flex: '0 0 auto' }}
            value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <select className="input" style={{ width: 'auto', flex: '0 0 auto' }}
            value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          {isAdmin && (
            <select className="input" style={{ width: 'auto', flex: '0 0 auto' }}
              value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                {isAdmin && <th>Assignee</th>}
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No tasks match the current filters
                </td></tr>
              ) : filtered.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <tr key={task.id} className={overdue ? 'overdue' : ''}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td>{task.project_name || '—'}</td>
                    {isAdmin && <td>{task.assignee_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>}
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td><StatusBadge status={task.status} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {overdue
                        ? <span style={{ color: 'var(--danger)', fontSize: 13 }}>⚠ {formatDate(task.due_date)}</span>
                        : formatDate(task.due_date)
                      }
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}
                        onClick={() => setEditTask(task)}>
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

      {/* Edit Modal */}
      {editTask && (
        <TaskModal
          task={editTask}
          projectId={editTask.project_id}
          onClose={() => setEditTask(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
