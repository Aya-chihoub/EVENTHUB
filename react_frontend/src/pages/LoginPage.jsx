import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#1e293b'
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: '2.5rem',
        width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: 28 }}>EventHub</h1>
        <p style={{ margin: '0 0 2rem', color: '#64748b' }}>Sign in to your account</p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', borderRadius: 6, padding: '10px 14px', marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {['username', 'password'].map((field) => (
            <div key={field} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151' }}>
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                value={form[field]}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 6,
                  border: '1px solid #d1d5db', fontSize: 15, boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: '#3b82f6',
              color: 'white', border: 'none', borderRadius: 6, fontSize: 16,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
