# Timey — MVP Phase 1 Documentation

**Version:** 1.0.0
**Date:** July 12, 2026
**Status:** MVP Phase 1 Complete

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Process Flow](#4-process-flow)
5. [Database Schema](#5-database-schema)
6. [In-Depth Code Explanation](#6-in-depth-code-explanation)
7. [Environment Setup](#7-environment-setup)
8. [Build & Run](#8-build--run)

---

## 1. Project Overview

**Timey** is a lightweight desktop focus timer and productivity tracking application. It allows users to set work session durations, define session goals, and track their historical productivity — all from a compact, always-on-top desktop window.

### Core Features (MVP Phase 1)

| Feature | Description |
|---|---|
| **Authentication** | Email/password sign-up and sign-in via Supabase Auth |
| **Timer Controls** | Play, Pause, Resume, and Stop with a live countdown display |
| **Goal Tracking** | Users define a text goal for each session (e.g. "Review Pull Requests") |
| **Session Logging** | Completed and manually stopped sessions are saved to Supabase PostgreSQL |
| **History View** | Collapsible list of past sessions, ordered by most recent |
| **System Tray** | App minimizes to the system tray instead of closing |
| **Native Notifications** | OS-level notification fires when a session reaches 00:00 |

### What's NOT in MVP Phase 1 (Planned for Later)

- Offline syncing / local caching
- Idle detection (auto-pause on inactivity)
- Advanced data visualization (charts, heatmaps)
- Multi-device real-time sync
- OAuth (GitHub/Google) login

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI Framework | **React 19** + **Vite 8** | Component-based UI with fast HMR and bundling |
| Desktop Wrapper | **Electron 43** | Native OS integration (tray, notifications, window management) |
| Database | **Supabase (PostgreSQL)** | Hosted PostgreSQL with automatic REST API |
| Authentication | **Supabase Auth** | Email/password auth with JWT-based sessions |
| Data Security | **Supabase RLS** | Row Level Security ensures users can only access their own data |
| Styling | **Tailwind CSS 4** | Utility-first CSS framework |
| Language | **TypeScript 6** | Type-safe JavaScript with strict mode enabled |
| Package Manager | **npm** | Dependency management |

---

## 3. Project Structure

```
timey/
├── docs/
│   └── MVP_PHASE1.md          # This documentation file
├── electron/
│   └── main.ts                # Electron main process (window, tray, notifications)
├── public/                    # Static assets (icon.png)
├── src/
│   ├── components/
│   │   ├── Auth.tsx           # Login/Signup form component
│   │   ├── Timer.tsx          # Timer with countdown, controls, and session save
│   │   └── SessionHistory.tsx # Displays past sessions from Supabase
│   ├── context/
│   │   └── AuthContext.tsx     # React context for authentication state
│   ├── lib/
│   │   └── supabase.ts        # Supabase client initialization
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces (Session, TimerState)
│   ├── App.tsx                # Root component — auth gate + layout
│   ├── main.tsx               # React entry point — wraps App in AuthProvider
│   ├── index.css              # Global styles (Tailwind import)
│   └── vite-env.d.ts          # Environment variable + window.electron type declarations
├── supabase/
│   ├── config.toml            # Supabase CLI configuration
│   └── migrations/
│       └── 20260712000000_create_sessions_table.sql
├── .env.local                 # Supabase URL and anon key (not committed)
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript compiler options
├── vite.config.ts             # Vite build config with @ path alias
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── eslint.config.js           # ESLint configuration
├── index.html                 # Vite HTML entry point
└── PRD.md                     # Product Requirements Document
```

---

## 4. Process Flow

### 4.1 Application Startup

```
Electron launches
    │
    ├─ main.ts: createWindow() → loads React app (localhost:5173 in dev, dist/index.html in prod)
    ├─ main.ts: createTray()   → creates system tray icon with context menu
    │
    └─ React app boots
         │
         └─ main.tsx → renders <AuthProvider> → <App />
              │
              └─ AuthProvider runs useEffect:
                   ├─ supabase.auth.getSession() → checks for existing JWT
                   ├─ supabase.auth.onAuthStateChange() → listens for auth events
                   └─ sets user/session state → loading becomes false
```

### 4.2 Authentication Flow

```
App renders
    │
    ├─ loading === true  → shows "Loading..." screen
    │
    ├─ user === null     → shows <Auth /> component
    │       │
    │       ├─ User enters email + password
    │       ├─ Toggles between Sign In / Sign Up mode
    │       ├─ On submit: calls signIn() or signUp() from AuthContext
    │       │       │
    │       │       ├─ signIn:  supabase.auth.signInWithPassword({ email, password })
    │       │       └─ signUp:  supabase.auth.signUp({ email, password })
    │       │
    │       ├─ On success: onAuthStateChange fires → user state updates → App re-renders
    │       └─ On error: error message displayed in red banner
    │
    └─ user !== null     → shows main app (header + timer + history)
```

### 4.3 Timer Lifecycle

```
IDLE STATE
    │
    ├─ User enters goal text and duration (minutes)
    ├─ User clicks Play button → handleStart()
    │       ├─ Converts minutes to seconds
    │       ├─ Sets totalSeconds, secondsLeft
    │       └─ setState('running')
    │
    ▼
RUNNING STATE
    │
    ├─ useEffect triggers setInterval (1 second tick)
    │       ├─ Each tick: secondsLeft -= 1
    │       ├─ Progress bar updates: ((total - left) / total) * 100
    │       │
    │       ├─ secondsLeft > 1 → continues counting
    │       │
    │       └─ secondsLeft <= 1 → SESSION COMPLETE
    │               ├─ clearInterval
    │               ├─ saveSession(totalSeconds, true) → INSERT into Supabase
    │               ├─ setState('completed')
    │               └─ Fires notification:
    │                       ├─ In Electron: window.electron.notify()
    │                       └─ In browser: new Notification()
    │
    ├─ User clicks Pause → handlePause()
    │       ├─ clearInterval
    │       └─ setState('paused')
    │
    └─ User clicks Stop → handleStop()
            ├─ clearInterval
            ├─ Calculates elapsed = totalSeconds - secondsLeft
            ├─ saveSession(elapsed, false) → INSERT into Supabase
            ├─ Resets secondsLeft to 0
            └─ setState('idle')
    │
    ▼
PAUSED STATE
    │
    ├─ User clicks Resume → handleResume() → setState('running') → interval restarts
    └─ User clicks Stop → handleStop() → saves partial session → returns to idle
    │
    ▼
COMPLETED STATE
    │
    ├─ Shows completion message with goal name and duration
    └─ User clicks "New Session" → handleReset() → setState('idle')
```

### 4.4 Data Persistence Flow

```
Session ends (completed or stopped)
    │
    └─ saveSession(actualDuration, completed)
         │
         ├─ Reads user.id from AuthContext
         ├─ Reads goal, totalSeconds from component state
         │
         └─ supabase.from('sessions').insert({
                user_id:        user.id,
                goal:           goal || 'Untitled session',
                planned_duration: totalSeconds,
                actual_duration:  actualDuration,
                completed:        completed
            })
                │
                ├─ Supabase validates JWT
                ├─ RLS policy checks: auth.uid() === user_id
                ├─ Row inserted into PostgreSQL
                └─ Data available for History view
```

### 4.5 History Fetch Flow

```
SessionHistory mounts
    │
    └─ useEffect (depends on user):
         │
         └─ supabase
              .from('sessions')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50)
              .then(({ data }) => setSessions(data ?? []))
                │
                ├─ Supabase RLS automatically filters to user's rows
                ├─ Returns up to 50 most recent sessions
                └─ Renders as scrollable list with goal, date, duration, status
```

---

## 5. Database Schema

### Table: `public.sessions`

```sql
create table public.sessions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  goal              text        not null default '',
  planned_duration  integer     not null default 0,   -- seconds
  actual_duration   integer     not null default 0,   -- seconds
  completed         boolean     not null default false,
  created_at        timestamptz not null default now()
);
```

### Indexes

| Index | Column | Purpose |
|---|---|---|
| `idx_sessions_user_id` | `user_id` | Fast lookups for a user's sessions |
| `idx_sessions_created_at` | `created_at DESC` | Fast ordering by date (most recent first) |

### Row Level Security (RLS) Policies

| Policy | Operation | Rule |
|---|---|---|
| Users can view their own sessions | SELECT | `auth.uid() = user_id` |
| Users can insert their own sessions | INSERT | `auth.uid() = user_id` |
| Users can update their own sessions | UPDATE | `auth.uid() = user_id` |
| Users can delete their own sessions | DELETE | `auth.uid() = user_id` |

All four CRUD operations are restricted so a user can only interact with rows where `user_id` matches their authenticated Supabase user ID. This means the client can safely query the `sessions` table directly — no backend API needed.

---

## 6. In-Depth Code Explanation

### 6.1 `src/types/index.ts` — Type Definitions

```typescript
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
```

- **`Session`** mirrors the database table schema. Every field maps 1:1 to a column in `public.sessions`. Used throughout the app for type-safe data handling.
- **`TimerState`** is a string union that represents the four possible states of the timer. Used as the type for the `state` variable in the Timer component, enabling exhaustive state handling.

---

### 6.2 `src/lib/supabase.ts` — Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Creates and exports a single Supabase client instance used across the entire application. Reads configuration from Vite environment variables (defined in `.env.local`). The `|| ''` fallback prevents runtime errors if env vars are missing (the app just won't connect to Supabase).

---

### 6.3 `src/context/AuthContext.tsx` — Authentication Provider

This file provides global authentication state to the entire React component tree.

#### Interface: `AuthContextType`

```typescript
interface AuthContextType {
  user: User | null;           // Current Supabase user object (or null if not logged in)
  session: SupabaseSession | null;  // Current JWT session (contains access_token, etc.)
  loading: boolean;            // True while checking for existing session on startup
  signUp: (email, password) => Promise<{ error?: string }>;
  signIn: (email, password) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}
```

#### `AuthProvider` Component

**State:**
- `user` — The authenticated Supabase `User` object, or `null`
- `session` — The full Supabase `Session` object (includes JWT tokens), or `null`
- `loading` — `true` until the initial session check completes

**`useEffect` (runs once on mount):**
1. Calls `supabase.auth.getSession()` — checks if a valid JWT exists in local storage from a previous session. Sets user/session accordingly.
2. Subscribes to `supabase.auth.onAuthStateChange()` — listens for future auth events (login, logout, token refresh). Automatically updates user/session state.
3. Returns cleanup function that unsubscribes from the listener.

**`signUp(email, password)`:**
- Calls `supabase.auth.signUp()` which creates a new user in Supabase Auth.
- Returns `{ error: string }` if something goes wrong (e.g. email already registered, weak password).

**`signIn(email, password)`:**
- Calls `supabase.auth.signInWithPassword()` which authenticates against existing users.
- Returns `{ error: string }` on failure (e.g. wrong credentials).

**`signOut()`:**
- Calls `supabase.auth.signOut()` which clears the JWT from local storage.
- `onAuthStateChange` fires → `user` becomes `null` → App re-renders to show Auth screen.

#### `useAuth()` Hook

Custom hook that consumes the context. Throws an error if used outside `<AuthProvider>`, catching misconfiguration early.

---

### 6.4 `src/components/Auth.tsx` — Login/Signup Form

**Purpose:** Renders a centered card with email/password inputs and a toggle between Sign In and Sign Up modes.

**State:**
- `isSignUp` — Toggles between sign-in and sign-up mode
- `email`, `password` — Form input values
- `error` — Error message string (cleared on mode switch and new submissions)
- `loading` — Disables the submit button while waiting for Supabase response

**`handleSubmit(e)`:**
1. Prevents default form submission.
2. Clears any previous error.
3. Sets `loading = true`.
4. Calls `signUp()` or `signIn()` based on `isSignUp` flag.
5. If result contains an error, displays it in a red banner.
6. Sets `loading = false`.

**Rendering:**
- Full-screen centered layout with dark theme.
- Email input (type="email", required).
- Password input (type="password", required, minLength=6).
- Submit button shows "Loading..." while waiting, otherwise "Sign In" or "Sign Up".
- Toggle link at the bottom switches between modes and clears errors.

---

### 6.5 `src/components/Timer.tsx` — Timer Core

This is the most complex component. It manages the entire timer lifecycle.

**State:**
- `goal` — Text string for the session objective
- `inputMinutes` — User-configured duration in minutes (default: 25)
- `secondsLeft` — Countdown value in seconds
- `totalSeconds` — The original duration set at start (used for progress calculation and saving)
- `state` — `TimerState` enum controlling which UI renders

**Refs:**
- `intervalRef` — Holds the `setInterval` ID for cleanup. Stored as a ref (not state) because it doesn't need to trigger re-renders.

#### Functions

**`formatTime(seconds)`:**
Converts total seconds to `MM:SS` format with zero-padding. Used for all countdown displays.

**`saveSession(actualDuration, completed)`:**
- Wrapped in `useCallback` with dependencies `[user, goal, totalSeconds]`.
- Guards against null user.
- Inserts a row into the `sessions` table with:
  - `user_id`: from auth context
  - `goal`: user-entered text (defaults to "Untitled session")
  - `planned_duration`: what the user set
  - `actual_duration`: how long the session actually ran
  - `completed`: `true` if timer finished naturally, `false` if manually stopped

**`handleStart()`:**
1. Converts `inputMinutes` to seconds.
2. Sets `totalSeconds` and `secondsLeft` to that value.
3. Sets state to `'running'`.

**`handlePause()`:**
1. Clears the interval (stops the countdown).
2. Sets state to `'paused'`.

**`handleResume()`:**
1. Sets state to `'running'` — the `useEffect` re-creates the interval.

**`handleStop()`:**
1. Clears the interval.
2. Calculates elapsed time: `totalSeconds - secondsLeft`.
3. Saves the session with `completed: false` if any time was spent.
4. Resets `secondsLeft` to 0, state to `'idle'`.

**`handleReset()`:**
1. Resets state to `'idle'` and `secondsLeft` to 0.
2. Used after completion to start a new session.

**`useEffect` (the countdown engine):**
- Only runs when `state === 'running'`.
- Creates a `setInterval` that ticks every 1000ms.
- Each tick decrements `secondsLeft` via the functional updater (avoids stale closure issues).
- When `secondsLeft <= 1`:
  - Clears the interval.
  - Saves the session as completed.
  - Sets state to `'completed'`.
  - Fires a notification (Electron or browser).
- Cleanup function clears the interval on unmount or state change.

**`progress`:**
Calculated as `((totalSeconds - secondsLeft) / totalSeconds) * 100`. Drives the progress bar width.

#### Rendered Views (conditional on `state`)

| State | What Renders |
|---|---|
| `idle` | Goal input, duration input, large Play button |
| `running` | Goal label, `MM:SS` countdown, progress bar, Pause + Stop buttons |
| `paused` | Goal label + "Paused", yellow `MM:SS`, Resume + Stop buttons |
| `completed` | Celebration message, goal name, total time, "New Session" button |

---

### 6.6 `src/components/SessionHistory.tsx` — History View

**Purpose:** Fetches and displays the user's past sessions from Supabase.

**State:**
- `sessions` — Array of `Session` objects
- `loading` — Loading indicator while fetching

**`useEffect` (runs when `user` changes):**
1. Queries `supabase.from('sessions').select('*')`.
2. Filters by `user_id` (redundant with RLS, but explicit).
3. Orders by `created_at` descending (most recent first).
4. Limits to 50 results.
5. Sets `sessions` state with the result.

**`formatDuration(seconds)`:**
Smart duration formatter:
- `>= 1 hour` → `"2h 30m"`
- `>= 1 minute` → `"25m 30s"`
- `< 1 minute` → `"45s"`

**`formatDate(dateStr)`:**
Converts ISO timestamp to a localized short format: `"Jul 12, 2:30 PM"`.

**Rendering:**
- Loading state → "Loading history..." message
- Empty state → "No sessions yet. Start your first one!"
- Sessions list → Each session as a card showing:
  - Left side: goal text (truncated) + formatted date
  - Right side: duration + status badge (green "Completed" or yellow "Stopped")

---

### 6.7 `src/App.tsx` — Root Component

**Purpose:** Orchestrates the entire application layout and auth gating.

**State:**
- `showHistory` — Boolean toggling the history panel visibility

**Logic:**
1. Gets `user`, `loading`, `signOut` from `useAuth()`.
2. If `loading` → shows loading screen.
3. If no `user` → shows `<Auth />` (full-screen login).
4. If `user` exists → shows the main app:
   - **Header:** App name + Sign Out button
   - **Timer:** `<Timer />` component (takes up remaining space)
   - **History toggle:** Button at the bottom that shows/hides `<SessionHistory />`
   - **History panel:** Scrollable container (max 256px height) that appears when toggled

---

### 6.8 `src/main.tsx` — Entry Point

```typescript
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

- Wraps the app in `React.StrictMode` for development warnings.
- Wraps in `AuthProvider` so all components can access auth state.
- Imports `index.css` which loads Tailwind CSS.

---

### 6.9 `src/vite-env.d.ts` — Type Declarations

**`ImportMetaEnv`:** Declares the two required Vite environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) so TypeScript knows about `import.meta.env.*`.

**`Window.electron`:** Declares the optional `window.electron.notify()` method that the Electron main process exposes via preload. This allows the React app to send native OS notifications when running in Electron, with a graceful fallback to the browser Notification API when running in a regular browser.

---

### 6.10 `electron/main.ts` — Electron Main Process

**Purpose:** Manages the native desktop window, system tray, and notifications.

#### `createWindow()`
- Creates a fixed-size window (400x600, non-resizable).
- Sets `nodeIntegration: false` and `contextIsolation: true` for security.
- In dev mode: loads `http://localhost:5173` (Vite dev server) and opens DevTools.
- In production: loads the built `dist/index.html`.
- Waits for `ready-to-show` before displaying (prevents white flash).
- Intercepts the close event: instead of closing, hides the window (close-to-tray behavior).

#### `createTray()`
- Loads `public/icon.png` as the tray icon.
- Creates a context menu with "Open Timey" and "Quit" options.
- Double-click on tray icon shows the window.
- "Quit" sets `isQuitting = true` and calls `app.quit()`.

#### `showNotification(title, body)`
- Creates and shows an Electron `Notification`.
- Exported for use from the renderer process (via preload script, not yet implemented — currently the React app uses the browser Notification API fallback).

#### App Lifecycle
- `app.whenReady()` → creates window and tray.
- `app.on('activate')` → re-creates window on macOS if all windows are closed.
- `app.on('window-all-closed')` → quits on Windows/Linux, stays open on macOS.

---

### 6.11 `supabase/migrations/20260712000000_create_sessions_table.sql` — Database Migration

The SQL migration that was pushed to Supabase via `supabase db push`. It:

1. **Creates the `sessions` table** with proper column types, defaults, and foreign key to `auth.users`.
2. **Enables RLS** on the table.
3. **Creates 4 RLS policies** (SELECT, INSERT, UPDATE, DELETE) that all check `auth.uid() = user_id`.
4. **Creates 2 indexes** for efficient querying by user and date.

---

## 7. Environment Setup

### `.env.local`

```
VITE_SUPABASE_URL=https://fqybnrrrawwplnscrdbx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

These values are injected by Vite at build time via `import.meta.env`. The Supabase client reads them to connect to your project.

### Supabase Project

- **Project Ref:** `fqybnrrrawwplnscrdbx`
- **Auth Provider:** Email/Password (enabled by default)
- **Database:** `sessions` table with RLS pushed via CLI migration

---

## 8. Build & Run

### Development

```bash
npm run dev          # Vite dev server on localhost:5173
npm run electron:dev # Vite + Electron simultaneously
```

### Production

```bash
npm run build        # tsc + vite build → dist/
npm run electron:build # vite build + electron-builder → packaged app
```

### Other Commands

```bash
npm run typecheck    # TypeScript type checking (no emit)
npm run lint         # ESLint checking
```
