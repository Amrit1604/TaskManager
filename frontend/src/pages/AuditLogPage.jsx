/**
 * pages/AuditLogPage.jsx
 * Admin-only page showing all task status changes across a project.
 */
import { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../api';
import { formatDateTime } from '../utils/helpers';
import { ClipboardList, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  todo:        '#94a3b8',
  in_progress: 'var(--info)',
  done:        'var(--success)',
};
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

export default function AuditLogPage() {
  const [projects,   setProjects]   = useState([]);
  const [selProject, setSelProject] = useState('');
  const [logs,       setLogs]       = useState([]);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    projectsAPI.list().then((r) => {
      setProjects(r.data.projects);
      if (r.data.projects.length > 0) setSelProject(String(r.data.projects[0].id));
    });
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!selProject) return;
    setLoading(true);
    try {
      const res = await projectsAPI.getAuditLog(selProject);
      setLogs(res.data.logs);
    } catch {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [selProject]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ClipboardList size={22} color="var(--accent-light)" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Audit Log</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>All task status changes — who changed what and when</p>
        </div>
        <select className="input" style={{ width: 240 }} value={selProject} onChange={(e) => setSelProject(e.target.value)}>
          <option value="">Select a project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Task</th>
                <th>Changed By</th>
                <th>Status Change</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  {selProject ? 'No status changes recorded yet for this project.' : 'Select a project to view audit logs.'}
                </td></tr>
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(log.changed_at)}</td>
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{log.task_title}</span>
                  </td>
                  <td style={{ fontSize: 13 }}>{log.changed_by_name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
                        background: `${STATUS_COLOR[log.old_status]}15`, color: STATUS_COLOR[log.old_status],
                      }}>{STATUS_LABEL[log.old_status]}</span>
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 999,
                        background: `${STATUS_COLOR[log.new_status]}15`, color: STATUS_COLOR[log.new_status],
                      }}>{STATUS_LABEL[log.new_status]}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
