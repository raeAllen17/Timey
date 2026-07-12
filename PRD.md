# Product Requirements Document: Desktop Focus Timer

**Product Name:** Timey

**Concept:** A lightweight, persistent desktop application that allows users to set work session durations, define session goals, and track their historical productivity.

---

## 1. Technology Stack

| Component          | Technology                   | Justification                                                 |
| ------------------ | ---------------------------- | ------------------------------------------------------------- |
| Frontend Framework | React + Vite                 | Fast build times, standard React ecosystem, easy to bundle for desktop. |
| Desktop Wrapper    | Electron                     | Access to native OS APIs (system tray, push notifications).   |
| Database & Auth    | Supabase                     | PostgreSQL with built-in Auth and Realtime capabilities.      |
| Data Security      | Supabase RLS                 | Row Level Security ensures users can only read/write their own session data directly from the desktop client. |
| Styling            | Tailwind CSS (Recommended)   | Rapid UI development for small desktop windows.               |

---

## 2. Core Features (MVP)

### 2.1 Timer & Goal Management

- **Time Input:** Users can input a custom time duration (e.g., 25 mins, 1 hour).
- **Goal Input:** A text field to define the specific objective for the session (e.g., "Write PRD for Timer App").
- **Controls:** Play, Pause, and Stop buttons to manage the active session.
- **Live Display:** A clear, real-time countdown of the remaining time.

### 2.2 Desktop Integration

- **System Tray / Menu Bar:** The app must be able to minimize the system tray (Windows) or Menu Bar (macOS) to keep the desktop clutter-free while running.
- **Native Notifications:** When a timer reaches 00:00, the app must trigger an OS-level push notification (e.g., "Session Complete: [Goal Name]").

### 2.3 Data & History

- **Session Logging:** Upon timer completion (or manual stop), the app logs the session data (User ID, Goal, Planned Duration, Actual Duration, Timestamp).
- **History View:** A simple list or table view within the app showing past sessions, ordered by date.
- **Authentication:** Users must be able to sign up/log in via email or OAuth (GitHub/Google) to sync their data.

---

## 3. User Flow (The Happy Path)

1. **Launch & Authenticate:** User opens the app and logs in via Supabase Auth.
2. **Define Session:** User types "Review Pull Requests" in the goal input and sets the timer for 45 minutes.
3. **Start & Minimize:** User clicks "Start". The countdown begins. The user minimizes the app, which hides it to the system tray.
4. **Work:** The app runs silently in the background.
5. **Completion:** At 45 minutes, an OS notification pops up: "Time's up! Goal completed: Review Pull Requests".
6. **Data Sync:** The app securely writes the 45-minute session to the Supabase database. User can view this in their "History" tab.

---

## 4. Out of Scope for MVP (Future Considerations)

To keep the initial build fast, these are explicitly excluded from Version 1:

- **Offline syncing** (caching sessions locally if the internet is down and syncing later).
- **Idle detection** (pausing the timer if mouse/keyboard input stops).
- **Advanced data visualization** (charts, weekly heatmaps).
- **Multi-device syncing** (real-time updates if the app is open on two computers).
