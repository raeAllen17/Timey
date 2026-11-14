import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { TimerState } from '@/types';

const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

const clampMinutes = (value: number) =>
  Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, value));

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

  const saveSession = useCallback(
    async (actualDuration: number, completed: boolean) => {
      if (!user) return;
      await supabase.from('sessions').insert({
        user_id: user.id,
        goal: goal || 'Untitled session',
        planned_duration: totalSeconds,
        actual_duration: actualDuration,
        completed,
      });
    },
    [user, goal, totalSeconds],
  );

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
            window.electron.notify("Time's up!", `Goal: ${goal || 'Untitled session'}`);
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

  const handleStart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const secs = clampMinutes(inputMinutes) * 60;
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

  const adjustMinutes = (delta: number) => {
    setInputMinutes((minutes) => clampMinutes(minutes + delta));
  };

  const handleMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number.parseInt(event.target.value, 10);
    setInputMinutes(Number.isNaN(next) ? MIN_MINUTES : clampMinutes(next));
  };

  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const displaySeconds = state === 'idle' ? inputMinutes * 60 : secondsLeft;
  const goalLabel = goal || 'Untitled session';
  const isRunning = state === 'running';
  const isPaused = state === 'paused';

  const dialKicker =
    state === 'idle'
      ? 'Ready'
      : state === 'running'
        ? 'In focus'
        : state === 'paused'
          ? 'Paused'
          : 'Complete';

  return (
    <main className="timer-stage">
      <p className="visually-hidden" aria-live="polite">
        {state === 'running'
          ? 'Timer running'
          : state === 'paused'
            ? 'Timer paused'
            : state === 'completed'
              ? 'Session complete'
              : ''}
      </p>

      <div
        className={`dial${state === 'completed' ? ' is-complete' : ''}`}
        style={{ '--progress': progress } as CSSProperties}
      >
        <div className="dial-ticks" aria-hidden="true" />
        <div className="dial-track" aria-hidden="true" />
        <div className="dial-face">
          <p className="dial-kicker">{dialKicker}</p>
          <p className="dial-time" role="timer" aria-label={`${formatTime(displaySeconds)} remaining`}>
            {formatTime(displaySeconds)}
          </p>
          <p className="dial-goal">
            {state === 'idle' ? `${inputMinutes} minute session` : goalLabel}
          </p>
        </div>
      </div>

      {state === 'idle' && (
        <form className="setup" onSubmit={handleStart}>
          <label className="field">
            <span className="field-label">What are you working on?</span>
            <input
              type="text"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="e.g. Review pull requests"
              maxLength={80}
            />
          </label>

          <div className="duration-row">
            <span className="field-label">Minutes</span>
            <div className="stepper">
              <button
                type="button"
                onClick={() => adjustMinutes(-5)}
                aria-label="Decrease by five minutes"
              >
                −
              </button>
              <input
                type="number"
                value={inputMinutes}
                onChange={handleMinutesChange}
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                aria-label="Session length in minutes"
              />
              <button
                type="button"
                onClick={() => adjustMinutes(5)}
                aria-label="Increase by five minutes"
              >
                +
              </button>
            </div>
          </div>

          <button className="start-btn" type="submit">
            Start focus
          </button>
        </form>
      )}

      {(isRunning || isPaused) && (
        <>
          <div className="controls">
            <button
              type="button"
              className="control control-primary"
              onClick={isRunning ? handlePause : handleResume}
            >
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button type="button" className="control control-danger" onClick={handleStop}>
              Stop
            </button>
          </div>
          <p className="session-note">
            {formatTime(secondsLeft)} left of {formatTime(totalSeconds)}
          </p>
        </>
      )}

      {state === 'completed' && (
        <>
          <div className="controls">
            <button type="button" className="start-btn" onClick={handleReset}>
              New session
            </button>
          </div>
          <p className="session-note">{formatTime(totalSeconds)} logged to your history.</p>
        </>
      )}
    </main>
  );
}
