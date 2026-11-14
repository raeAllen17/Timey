import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Session } from '@/types';

export default function SessionHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error: queryError }) => {
        if (cancelled) return;
        if (queryError) {
          setError('History could not load. Try again in a moment.');
        } else {
          setSessions(data ?? []);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <p className="history-empty">Loading history</p>;
  }

  if (error) {
    return (
      <p className="history-empty" role="alert">
        {error}
      </p>
    );
  }

  if (sessions.length === 0) {
    return <p className="history-empty">No sessions yet. Start your first one above.</p>;
  }

  return (
    <ul className="history-list">
      {sessions.map((session) => (
        <li className="history-row" key={session.id}>
          <div className="history-detail">
            <p className="history-goal">{session.goal || 'Untitled session'}</p>
            <p className="history-date">{formatDate(session.created_at)}</p>
          </div>
          <div className="history-stats">
            <p>{formatDuration(session.actual_duration)}</p>
            <p className={`history-status ${session.completed ? 'is-complete' : 'is-stopped'}`}>
              {session.completed ? 'Completed' : 'Stopped'}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
