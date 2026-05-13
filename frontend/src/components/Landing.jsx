export default function Landing({ onEnter }) {
  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="landing-orbit"/>
        <div className="landing-orbit-2"/>
        <div className="landing-glow"/>
      </div>

      <nav className="landing-nav">
        <div className="landing-brand">
          <img src="/andromeda-logo.svg" alt="Andromeda" className="landing-brand-img"/>
          <span className="landing-brand-name">Andromeda<span className="dim">.ai</span></span>
        </div>
        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#docs">Docs</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="landing-nav-actions">
          <button className="landing-btn ghost" onClick={onEnter}>Sign In</button>
          <button className="landing-btn primary" onClick={onEnter}>Get Started</button>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="landing-hero-badge">
          <span className="landing-badge-dot"/>
          v0.4 — Agent Studio for Tech Teams
        </div>
        <h1 className="landing-hero-title">
          Build, orchestrate, and run<br/>
          <span className="accent-text">AI agent workflows</span>
        </h1>
        <p className="landing-hero-sub">
          Andromeda is a visual agent orchestration studio purpose-built for tech teams.
          Drag, drop, and configure AI agents for code generation, testing, data pipelines,
          deployments, and sprint ceremonies — all in one place.
        </p>
        <div className="landing-hero-actions">
          <button className="landing-btn primary large" onClick={onEnter}>
            Get Started Free
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
          <button className="landing-btn ghost large" onClick={onEnter}>
            Sign In
          </button>
        </div>
        <div className="landing-hero-meta">
          <span>No credit card required</span>
          <span className="sep"/>
          <span>BYOK — bring your own LLM keys</span>
          <span className="sep"/>
          <span>Local-first, privacy-first</span>
        </div>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-logos">
          <span>Built for</span>
          <span className="logo-chip">Developers</span>
          <span className="logo-chip">QA</span>
          <span className="logo-chip">Data Engineers</span>
          <span className="logo-chip">DevOps</span>
          <span className="logo-chip">Scrum Masters</span>
        </div>
      </footer>
    </div>
  );
}
