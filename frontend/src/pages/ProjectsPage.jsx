/**
 * pages/ProjectsPage.jsx
 * Lists all projects. Admin can create, delete.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { FolderKanban, Plus, Trash2, Users, ArrowRight, Calendar } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const fieldErr = (name) => errors.find((e) => e.field === name)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await projectsAPI.create(form);
      toast.success('Project created!');
      onCreated();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setErrors(data.fields);
      else toast.error(data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label htmlFor="proj-name">Project Name *</label>
          <input id="proj-name" className="input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Website Redesign" required />
          {fieldErr('name') && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{fieldErr('name')}</p>}
        </div>
        <div>
          <label htmlFor="proj-desc">Description</label>
          <textarea id="proj-desc" className="input" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What is this project about?" rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsAPI.list();
      setProjects(res.data.projects);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (project) => {
    if (!confirm(`Delete project "${project.name}"? This is a soft delete — data is preserved.`)) return;
    try {
      await projectsAPI.delete(project.id);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <FolderKanban size={22} color="var(--accent-light)" />
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Projects</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1,2,3].map((i) => <div key={i} className="skeleton" style={{ height: 180 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <FolderKanban size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>No projects yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {projects.map((project) => (
            <div key={project.id} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid var(--border-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderKanban size={20} color="var(--accent-light)" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{project.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>by {project.creator_name}</div>
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn btn-ghost" style={{ padding: 6, minWidth: 'auto' }}
                    onClick={() => handleDelete(project)} title="Delete project">
                    <Trash2 size={15} color="var(--danger)" />
                  </button>
                )}
              </div>

              {project.description && (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {project.description.slice(0, 100)}{project.description.length > 100 ? '…' : ''}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> {formatDate(project.created_at)}
                </span>
              </div>

              <Link to={`/projects/${project.id}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--accent-light)', fontWeight: 500, fontSize: 14, textDecoration: 'none', padding: '8px 0', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                View Project <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={fetchProjects} />}
    </div>
  );
}
