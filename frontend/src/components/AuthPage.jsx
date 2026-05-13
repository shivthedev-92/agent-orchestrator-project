import { useState } from 'react';

export default function AuthPage({ onAuth, onBack }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'signup' && !name) return;
    onAuth({ mode, email, name });
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orbit"/>
        <div className="auth-glow"/>
      </div>

      <div className="auth-card">
        <button className="auth-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          Back
        </button>

        <div className="auth-header">
          <img src="/andromeda-logo.svg" alt="Andromeda" className="auth-brand-mark"/>
          <h2>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
          <p>{mode === 'signin' ? 'Sign in to Andromeda to continue' : 'Start building agent workflows with your team'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="auth-field">
              <label>Full name</label>
              <input type="text" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === 'signin' && (
            <button type="button" className="auth-forgot">Forgot password?</button>
          )}
          <button type="submit" className="auth-submit">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        <div className="auth-social">
          <button type="button" className="auth-social-btn" onClick={() => onAuth({ mode, provider: 'google' })}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button type="button" className="auth-social-btn" onClick={() => onAuth({ mode, provider: 'apple' })}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Apple
          </button>
        </div>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <span>No account? <button type="button" onClick={() => setMode('signup')}>Create one</button></span>
          ) : (
            <span>Already have an account? <button type="button" onClick={() => setMode('signin')}>Sign in</button></span>
          )}
        </div>
      </div>
    </div>
  );
}
