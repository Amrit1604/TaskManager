/**
 * pages/DashboardPage.jsx
 * Minimalist Monochrome dashboard.
 */
import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import TaskModal from '../components/TaskModal';
import { isOverdue, formatDate } from '../utils/helpers';

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
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
        const allTasks = await Promise.all(
          projRes.data.projects.map((p) => tasksAPI.listByProject(p.id).then((r) => r.data.tasks))
        );
        setTasks(allTasks.flat());
      } else {
        setTasks(dashRes.data.tasks || []);
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

  const filtered = tasks.filter((t) => {
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterProject  && String(t.project_id) !== filterProject) return false;
    return true;
  });

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div style={{ marginBottom: 64 }}>
        <h1 className="text-7xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
          Dashboard.
        </h1>
        <div className="rule-thick" style={{ width: 120, marginBottom: 16 }}></div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
          {isAdmin ? 'Global overview of all activities.' : 'Your assigned tasks and responsibilities.'}
        </p>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 32, marginBottom: 64 }}>
          {[1,2,3,4,5].map((i) => <div key={i} className="skeleton" style={{ height: 160 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 32, marginBottom: 64 }}>
          <StatCard label="Total Tasks"   value={stats?.total} />
          <StatCard label="To Do"         value={stats?.todo} />
          <StatCard label="In Progress"   value={stats?.in_progress} />
          <StatCard label="Completed"     value={stats?.done} />
          <StatCard label="Overdue"       value={stats?.overdue} />
        </div>
      )}

      {/* Filters + Table */}
      <div className="rule-ultra" style={{ marginBottom: 32 }}></div>
      <h2 className="text-4xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 32 }}>Tasks Register</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filters:</span>

        <select className="input" style={{ width: 200 }}
          value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select className="input" style={{ width: 200 }}
          value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {isAdmin && (
          <select className="input" style={{ width: 240 }}
            value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
            <option value="">All Projects</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}

        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Showing {filtered.length} items
        </span>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              {isAdmin && <th>Assignee</th>}
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 64, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Loading data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 64, color: 'var(--muted-foreground)', fontStyle: 'italic' }}>
                No tasks found matching criteria.
              </td></tr>
            ) : filtered.map((task) => {
              const overdue = isOverdue(task);
              return (
                <tr key={task.id} className={overdue ? 'overdue' : ''}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 4, fontStyle: 'italic' }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                  </td>
                  <td>{task.project_name || '—'}</td>
                  {isAdmin && <td>{task.assignee_name || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Unassigned</span>}</td>}
                  <td><PriorityBadge priority={task.priority} /></td>
                  <td><StatusBadge status={task.status} /></td>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: overdue ? 700 : 400 }}>
                    {formatDate(task.due_date)}
                  </td>
                  <td>
                    <button className="btn btn-ghost" style={{ padding: '8px 16px' }}
                      onClick={() => setEditTask(task)}>
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
