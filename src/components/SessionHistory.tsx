import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Session } from '@/types';

export default function SessionHistory() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setSessions(data ?? []);
        setLoading(false);
      });
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
    return (
      <div className="p-4 text-center text-gray-500">Loading history...</div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No sessions yet. Start your first one!</div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.id}
          className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="text-white font-medium truncate">{s.goal || 'Untitled session'}</p>
            <p className="text-xs text-gray-400">{formatDate(s.created_at)}</p>
          </div>
          <div className="text-right ml-4 shrink-0">
            <p className="text-sm font-mono text-gray-300">{formatDuration(s.actual_duration)}</p>
            <p className={`text-xs ${s.completed ? 'text-green-400' : 'text-yellow-400'}`}>
              {s.completed ? 'Completed' : 'Stopped'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
