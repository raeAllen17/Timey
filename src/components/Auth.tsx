import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="auth">
      <header className="auth-head">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Timey</span>
      </header>

      <div className="auth-body">
        <h1 className="auth-title">Make the time count.</h1>
        <p className="auth-lede">
          {isSignUp
            ? 'Create an account to keep every focus session in one place.'
            : 'Sign in to pick up where your focus left off.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </label>

          <button className="start-btn" type="submit" disabled={loading}>
            {loading ? 'One moment' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          <p className="auth-switch">
            {isSignUp ? 'Already have an account?' : 'New to Timey?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </form>
      </div>

      <footer className="auth-foot">A quiet timer for focused work.</footer>
    </div>
  );
}
