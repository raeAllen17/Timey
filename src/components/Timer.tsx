import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { TimerState } from '@/types';

export default function Timer() {
  const { user } = useAuth();

  const [goal, setGoal] = useState('');
  const [inputMinutes, setInputMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [state, setState] = useState<TimerState>('idle');

  const intervalRef = useRef<number | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const saveSession = useCallback(async (actualDuration: number, completed: boolean) => {
    if (!user) return;
    await supabase.from('sessions').insert({
      user_id: user.id,
      goal: goal || 'Untitled session',
      planned_duration: totalSeconds,
      actual_duration: actualDuration,
      completed,
    });
  }, [user, goal, totalSeconds]);

  useEffect(() => {
    if (state !== 'running') return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          saveSession(totalSeconds, true);
          setState('completed');

          if (window.electron) {
            window.electron.notify('Time\'s up!', `Goal: ${goal || 'Untitled session'}`);
          } else {
            new Notification("Time's up!", { body: `Goal: ${goal || 'Untitled session'}` });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state, totalSeconds, goal, saveSession]);

  const handleStart = () => {
    const secs = inputMinutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setState('running');
  };

  const handlePause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState('paused');
  };

  const handleResume = () => {
    setState('running');
  };

  const handleStop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const elapsed = totalSeconds - secondsLeft;
    if (elapsed > 0) {
      saveSession(elapsed, false);
    }
    setSecondsLeft(0);
    setState('idle');
  };

  const handleReset = () => {
    setState('idle');
    setSecondsLeft(0);
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 space-y-6">
      {state === 'idle' && (
        <>
          <div className="w-full max-w-xs space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Goal</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Review Pull Requests"
                className="w-full bg-gray-800 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={inputMinutes}
                onChange={(e) => setInputMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full bg-gray-800 text-white rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </>
      )}

      {state === 'running' && (
        <>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">{goal || 'Untitled session'}</p>
            <p className="text-6xl font-mono font-bold">{formatTime(secondsLeft)}</p>
          </div>

          <div className="w-full max-w-xs">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePause}
              className="w-14 h-14 rounded-full bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
            <button
              onClick={handleStop}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </>
      )}

      {state === 'paused' && (
        <>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">{goal || 'Untitled session'} — Paused</p>
            <p className="text-6xl font-mono font-bold text-yellow-400">{formatTime(secondsLeft)}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleResume}
              className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              onClick={handleStop}
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
          </div>
        </>
      )}

      {state === 'completed' && (
        <>
          <div className="text-center space-y-2">
            <p className="text-4xl">🎉</p>
            <p className="text-xl font-semibold">Session Complete!</p>
            <p className="text-gray-400">{goal || 'Untitled session'}</p>
            <p className="text-sm text-gray-500">
              {formatTime(totalSeconds)} focused
            </p>
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            New Session
          </button>
        </>
      )}
    </main>
  );
}
