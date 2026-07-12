export interface Session {
  id: string;
  user_id: string;
  goal: string;
  planned_duration: number;
  actual_duration: number;
  completed: boolean;
  created_at: string;
}

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';
