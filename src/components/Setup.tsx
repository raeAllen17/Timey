export default function Setup() {
  return (
    <div className="auth">
      <header className="auth-head">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Timey</span>
      </header>

      <div className="auth-body">
        <h1 className="auth-title">Almost there.</h1>
        <p className="auth-lede">
          Add your Supabase project URL and anon key to a <code>.env.local</code> file in the
          project root, then rebuild and restart Timey.
        </p>
        <pre className="setup-code">
          <code>
            VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
            VITE_SUPABASE_ANON_KEY=your-anon-key
          </code>
        </pre>
        <p className="auth-lede">
          Copy <code>.env.example</code> to <code>.env.local</code> to start.
        </p>
      </div>

      <footer className="auth-foot">A quiet timer for focused work.</footer>
    </div>
  );
}
