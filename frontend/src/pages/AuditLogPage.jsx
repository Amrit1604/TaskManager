/**
 * pages/AuditLogPage.jsx
 * Minimalist Monochrome Audit Log.
 */
import { useState, useEffect, useCallback } from 'react';
import { projectsAPI } from '../api';
import { formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

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
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 32 }}>
        <div>
          <h1 className="text-8xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
            Audit.
          </h1>
          <div className="rule-thick" style={{ width: 160, marginBottom: 16 }}></div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            System Ledger
          </p>
        </div>
        <select className="input" style={{ width: 300, border: '2px solid var(--border)' }} value={selProject} onChange={(e) => setSelProject(e.target.value)}>
          <option value="">Select a project…</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Task</th>
              <th>Operator</th>
              <th>State Transition</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 64, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>Processing ledger...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 64, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
                {selProject ? 'Ledger is empty.' : 'Select a project.'}
              </td></tr>
            ) : logs.map((log) => (
              <tr key={log.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-foreground)' }}>
                  {formatDateTime(log.changed_at)}
                </td>
                <td style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 18 }}>
                  {log.task_title}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase' }}>
                  {log.changed_by_name}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--muted-foreground)' }}>{log.old_status}</span>
                    <span>→</span>
                    <span style={{ fontWeight: 700 }}>{log.new_status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
