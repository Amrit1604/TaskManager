/**
 * pages/DashboardPage.jsx
 * Minimalist Monochrome dashboard.
 */
import { useState, useEffect, useCallback } from 'react';
import { tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import TaskModal from '../components/TaskModal';
import { isOverdue, formatDate, formatDateTime } from '../utils/helpers';

function StatCard({ label, value, isRed }) {
  return (
    <div className={`stat-card ${isRed ? 'overdue' : ''}`} style={isRed && value > 0 ? { border: '2px solid #E11D48', background: '#FFF1F2', color: '#E11D48' } : {}}>
      <div className="stat-value" style={isRed && value > 0 ? { color: '#E11D48' } : {}}>{value ?? '—'}</div>
      <div className="stat-label" style={isRed && value > 0 ? { color: '#E11D48' } : {}}>{label}</div>
    </div>
  );
}

function formatAuditMessage(log) {
  const who = log.changed_by_name || 'System';
  const task = `"${log.task_title}"`;
  
  if (log.action === 'created') {
    return `${who} created task ${task}`;
  }
  if (log.action === 'submitted') {
    return `${who} submitted work on ${task}`;
  }
  if (log.action === 'updated') {
    if (log.field === 'status') {
      const oldVal = (log.old_value || 'todo').toUpperCase().replace('_', ' ');
      const newVal = (log.new_value || 'todo').toUpperCase().replace('_', ' ');
      return `${who} updated status of ${task} from ${oldVal} to ${newVal}`;
    }
    if (log.field === 'priority') {
      const oldVal = (log.old_value || 'medium').toUpperCase();
      const newVal = (log.new_value || 'medium').toUpperCase();
      return `${who} changed priority of ${task} from ${oldVal} to ${newVal}`;
    }
    if (log.field === 'assignee') {
      return `${who} updated assignee of ${task}: ${log.old_value} → ${log.new_value}`;
    }
    if (log.field === 'due_date') {
      return `${who} changed due date of ${task}: ${log.old_value} → ${log.new_value}`;
    }
    return `${who} updated ${log.field} of ${task}`;
  }
  return `${who} performed action on ${task}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [stats,     setStats]     = useState(null);
  const [tasks,     setTasks]     = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [audits,    setAudits]    = useState([]);
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
      const projList = projRes.data.projects || [];
      setProjects(projList);

      if (isAdmin) {
        setStats(dashRes.data.stats);
        const allTasks = await Promise.all(
          projList.map((p) => tasksAPI.listByProject(p.id).then((r) => r.data.tasks || []).catch(() => []))
        );
        setTasks(allTasks.flat());

        // Fetch recent audit logs for all projects
        const allAudits = await Promise.all(
          projList.map((p) => projectsAPI.getAuditLog(p.id).then((r) => r.data.logs || []).catch(() => []))
        );
        const combinedAudits = allAudits.flat()
          .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
          .slice(0, 15);
        setAudits(combinedAudits);
      } else {
        const t = dashRes.data.tasks || [];
        setTasks(t);
        setStats({
          total: t.length,
          todo: t.filter((x) => x.status === 'todo').length,
          in_progress: t.filter((x) => x.status === 'in_progress').length,
          done: t.filter((x) => x.status === 'done').length,
          overdue: t.filter(isOverdue).length,
        });

        // Members fetch audit logs for projects they are in
        const allAudits = await Promise.all(
          projList.map((p) => projectsAPI.getAuditLog(p.id).then((r) => r.data.logs || []).catch(() => []))
        );
        const combinedAudits = allAudits.flat()
          .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))
          .slice(0, 15);
        setAudits(combinedAudits);
      }
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
          <StatCard label="Overdue"       value={stats?.overdue} isRed={true} />
        </div>
      )}

      {/* Grid container for Tasks Register & Activity feed */}
      <div className="dashboard-content-grid">
        {/* Left Side: Tasks Register */}
        <div>
          <div className="rule-ultra" style={{ marginBottom: 32 }}></div>
          <h2 className="text-4xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 32 }}>Tasks Register</h2>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginBottom: 32, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Filters:</span>

            <select className="input" style={{ width: 160 }}
              value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>

            <select className="input" style={{ width: 160 }}
              value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            {isAdmin && (
              <select className="input" style={{ width: 200 }}
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
                    <tr key={task.id} className={overdue ? 'overdue' : ''} style={overdue ? { background: '#FFF1F2' } : {}}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontWeight: 600 }}>{task.title}</div>
                          {overdue && (
                            <span style={{ color: '#E11D48', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>
                              ⚠️ OVERDUE
                            </span>
                          )}
                        </div>
                        {task.description && <div style={{ fontSize: 14, color: 'var(--muted-foreground)', marginTop: 4, fontStyle: 'italic' }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '…' : ''}</div>}
                      </td>
                      <td>{task.project_name || '—'}</td>
                      {isAdmin && <td>{task.assignee_name || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Unassigned</span>}</td>}
                      <td><PriorityBadge priority={task.priority} /></td>
                      <td><StatusBadge status={task.status} /></td>
                      <td style={{ whiteSpace: 'nowrap', fontWeight: overdue ? 700 : 400, color: overdue ? '#E11D48' : 'inherit' }}>
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
        </div>

        {/* Right Side: Activity Feed */}
        <div style={{ marginTop: 120 }}>
          <div className="card" style={{ border: '2px solid var(--border)', background: 'var(--muted)', padding: 24, position: 'sticky', top: 32 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, marginBottom: 24, borderBottom: '2px solid var(--border)', paddingBottom: 12 }}>
              Activity.
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxHeight: 600, overflowY: 'auto', paddingRight: 8 }}>
              {loading ? (
                [1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 60 }} />)
              ) : audits.length === 0 ? (
                <div style={{ fontStyle: 'italic', color: 'var(--muted-foreground)', textAlign: 'center', padding: '32px 0' }}>
                  No recent activity.
                </div>
              ) : audits.map((log) => (
                <div key={log.id} style={{ fontSize: 13, borderBottom: '1px solid var(--border-light)', paddingBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, lineHeight: 1.4 }}>
                    {formatAuditMessage(log)}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)' }}>
                    {formatDateTime(log.changed_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

