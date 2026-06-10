import React from 'react';
import { useAuth } from '../../shared/auth/AuthContext';

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Wooking for Work</h1>
          <p className="login-subtitle">Job hunting automation</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

          {error && <div className="login-error">{error}</div>}

          {mode === 'register' && (
            <div className="login-field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name" disabled={busy} autoFocus />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" disabled={busy}
              autoFocus={mode === 'login'} />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" disabled={busy} />
          </div>

          <button type="submit" className="btn primary login-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="login-toggle">
          {mode === 'login' ? (
            <>No account? <a href="#" onClick={toggleMode}>Create one</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={toggleMode}>Sign in</a></>
          )}
        </p>
      </div>
    </div>
  );
}
