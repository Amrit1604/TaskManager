/**
 * pages/SignupPage.jsx
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const { signup }  = useAuth();
  const navigate    = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'member' });
  const [show,    setShow]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState([]);

  const fieldErr = (name) => errors.find((e) => e.field === name)?.message;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    try {
      await signup(form);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setErrors(data.fields);
      else toast.error(data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{
        position: 'fixed', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px var(--accent-glow)' }}>
            <CheckSquare size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>Join TaskFlow and start collaborating</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="signup-name">Full Name</label>
              <input id="signup-name" className={`input${fieldErr('name') ? ' error' : ''}`} value={form.name}
                onChange={(e) => set('name', e.target.value)} placeholder="Your full name" required />
              {fieldErr('name') && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{fieldErr('name')}</p>}
            </div>

            <div>
              <label htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" className={`input${fieldErr('email') ? ' error' : ''}`} value={form.email}
                onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required />
              {fieldErr('email') && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{fieldErr('email')}</p>}
            </div>

            <div>
              <label htmlFor="signup-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="signup-password" type={show ? 'text' : 'password'} className={`input${fieldErr('password') ? ' error' : ''}`}
                  value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  style={{ paddingRight: 42 }} required />
                <button type="button" onClick={() => setShow(!show)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {fieldErr('password') && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{fieldErr('password')}</p>}
            </div>

            <div>
              <label htmlFor="signup-role">Account Type</label>
              <select id="signup-role" className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="member">Team Member — can view and update assigned tasks</option>
                <option value="admin">Admin — can create projects and assign tasks</option>
              </select>
            </div>

            <button id="btn-signup" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
