/**
 * pages/ProjectsPage.jsx
 * Minimalist Monochrome project list.
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
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
      toast.success('PROJECT ESTABLISHED');
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
    <Modal title="Establish Project" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <label htmlFor="proj-name">Project Nomenclature</label>
          <input id="proj-name" className="input" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Q4 Editorial" required />
          {fieldErr('name') && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, fontWeight: 700 }}>ERROR: {fieldErr('name')}</p>}
        </div>
        <div>
          <label htmlFor="proj-desc">Executive Summary</label>
          <textarea id="proj-desc" className="input" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief abstract..." rows={4} style={{ resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', borderTop: '2px solid var(--border)', paddingTop: 24 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Dismiss</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Establish'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();

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

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 64, flexWrap: 'wrap', gap: 32 }}>
        <div>
          <h1 className="text-8xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
            Projects.
          </h1>
          <div className="rule-thick" style={{ width: 160, marginBottom: 16 }}></div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Directory of {projects.length} initiative{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          New Project
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 32 }}>
          {[1,2,3,4].map((i) => <div key={i} className="skeleton" style={{ height: 240 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card texture-grid" style={{ padding: 120, textAlign: 'center', border: '4px solid var(--border)' }}>
          <h3 className="text-5xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 16 }}>Empty Directory</h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontStyle: 'italic', color: 'var(--muted-foreground)' }}>
            Establish a project to begin.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 32 }}>
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card card-hover" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3 className="text-4xl" style={{ fontFamily: 'var(--font-serif)', marginBottom: 8, lineHeight: 1.1 }}>{project.name}</h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid var(--border)' }}>
                  Led by {project.creator_name}
                </div>
                
                {project.description && (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.6, marginBottom: 32, flex: 1 }}>
                    {project.description.slice(0, 150)}{project.description.length > 150 ? '…' : ''}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Est. {formatDate(project.created_at)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>
                    ENTER →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={fetchProjects} />}
    </div>
  );
}
