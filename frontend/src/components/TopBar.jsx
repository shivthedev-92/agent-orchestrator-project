import RobotAvatar from './RobotAvatar';

export default function TopBar({ theme, onTheme, running, onRun, onStop, agentCount, connCount, runStep, runOrder, runElapsed, dirty }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark"/>
        <div>
          <div className="brand-name">Orchestra</div>
        </div>
        <span className="brand-sub mono">v0.4</span>
      </div>

      <div className="crumbs">
        <span>Workspaces</span>
        <span className="sep">/</span>
        <span>Acme Travel</span>
        <span className="sep">/</span>
        <span className="cur">Trip planner v3{dirty ? <span style={{ color: 'var(--fg-faint)', marginLeft: 6 }}>•</span> : null}</span>
      </div>

      <div className="topbar-spacer"/>

      <div className={`runtime-pill ${running ? 'running' : ''}`}>
        <span className="dot"/>
        <span>{agentCount} agents</span>
        <span style={{ color: 'var(--fg-faint)' }}>·</span>
        <span>{connCount} edges</span>
        {running && <>
          <span style={{ color: 'var(--fg-faint)' }}>·</span>
          <span>step {Math.min(runStep + 1, runOrder.length)}/{runOrder.length}</span>
          <span style={{ color: 'var(--fg-faint)' }}>·</span>
          <span>{runElapsed}s</span>
        </>}
      </div>

      <div className="topbar-actions">
        <button className="tb-btn icon" title="Undo">
          <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7l-3 3"/></svg>
        </button>
        <button className="tb-btn icon" title="Redo">
          <svg width="15" height="15" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-3-7l3 3"/></svg>
        </button>
        <span style={{ width: 8 }}/>
        <button className="tb-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.07a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </button>
        <button className="tb-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </button>

        <span style={{ width: 8 }}/>
        <div className="theme-toggle" role="tablist" aria-label="Theme">
          <button className={theme === 'light' ? 'active' : ''} onClick={() => onTheme('light')} title="Light">
            <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          </button>
          <button className={theme === 'dark' ? 'active' : ''} onClick={() => onTheme('dark')} title="Dark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
        </div>

        <span style={{ width: 6 }}/>
        {!running ? (
          <button className="run-btn" onClick={onRun}>
            <span className="play-tri"/> Run
          </button>
        ) : (
          <button className="run-btn running" onClick={onStop}>
            <span className="stop-sq"/> Stop
          </button>
        )}
      </div>
    </header>
  );
}
