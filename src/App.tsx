import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Auth from '@/components/Auth';
import Timer from '@/components/Timer';
import SessionHistory from '@/components/SessionHistory';

export default function App() {
  const { user, loading, signOut } = useAuth();
  const [showHistory, setShowHistory] = useState(false);

  if (loading) {
    return (
      <div className="loading">
        <span className="brand-mark" aria-hidden="true" />
        <p>Loading your sessions</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">Timey</span>
        </div>
        <button type="button" className="signout" onClick={signOut}>
          Sign out
        </button>
      </header>

      <Timer />

      <section className={`history${showHistory ? ' is-open' : ''}`}>
        <button
          type="button"
          className="history-toggle"
          aria-expanded={showHistory}
          aria-controls="session-history"
          onClick={() => setShowHistory((open) => !open)}
        >
          <span>History</span>
          <span className="history-meta">{showHistory ? 'Close' : 'Open'}</span>
        </button>

        {showHistory && (
          <div className="history-scroll" id="session-history">
            <SessionHistory />
          </div>
        )}
      </section>
    </div>
  );
}
