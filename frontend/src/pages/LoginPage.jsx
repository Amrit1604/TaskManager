/**
 * pages/LoginPage.jsx
 * Minimalist Monochrome login.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState([]);

  const fieldErr = (name) => errors.find((e) => e.field === name)?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('AUTHENTICATED');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.fields) setErrors(data.fields);
      else toast.error(data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }} className="texture-diagonal">
      <div className="card" style={{ width: '100%', maxWidth: 480, border: '4px solid var(--border)', padding: 64 }}>
        
        <div style={{ marginBottom: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontFamily: 'var(--font-serif)', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: 16 }}>
            TASKFLOW.
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            System Access
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <label htmlFor="email">Email Identification</label>
            <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
            {fieldErr('email') && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, fontWeight: 700 }}>ERROR: {fieldErr('email')}</p>}
          </div>

          <div>
            <label htmlFor="password">Passkey</label>
            <input id="password" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            {fieldErr('password') && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 8, fontWeight: 700 }}>ERROR: {fieldErr('password')}</p>}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Authenticating...' : 'Enter'}
          </button>
        </form>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '2px solid var(--border)', textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 14 }}>
          Unregistered? <Link to="/signup" style={{ color: 'var(--foreground)', fontWeight: 700 }}>Apply for access</Link>
        </div>
      </div>
    </div>
  );
}
