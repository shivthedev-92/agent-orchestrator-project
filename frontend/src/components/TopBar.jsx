import { useState, useRef, useEffect } from 'react';
import RobotAvatar from './RobotAvatar';

export default function TopBar({
  theme, onTheme, running, onRun, onStop,
  agentCount, connCount, runStep, runOrder, runElapsed, dirty,
  saving, workflowId, workflowName, workflowList, workflowLoading,
  onSave, onNew, onDelete, onSwitch, onRename,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameBuf, setNameBuf] = useState(workflowName);
  const inputRef = useRef(null);

  useEffect(() => { setNameBuf(workflowName); }, [workflowName]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitName = () => {
    setEditing(false);
    const v = nameBuf.trim();
    if (v && v !== workflowName) onRename(v);
    else setNameBuf(workflowName);
  };

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
        <div className="crumb-dropdown-wrap">
          <span className="crumb-dropdown-trigger" onClick={() => setMenuOpen((o) => !o)}>
            Workspaces
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 4 }}><path d="M6 9l6 6 6-6"/></svg>
          </span>
          {menuOpen && (
            <div className="crumb-dropdown">
              {workflowLoading ? (
                <div className="crumb-dd-item disabled">Loading...</div>
              ) : workflowList.length === 0 ? (
                <div className="crumb-dd-item disabled">No workflows</div>
              ) : workflowList.map((wf) => (
                <div
                  key={wf.id}
                  className={`crumb-dd-item ${wf.id === workflowId ? 'active' : ''}`}
                  onClick={() => { onSwitch(wf.id); setMenuOpen(false); }}
                >
                  <span className="crumb-dd-name">{wf.name}</span>
                  <span className="crumb-dd-date">{new Date(wf.updated_at).toLocaleDateString()}</span>
                </div>
              ))}
              <div className="crumb-dd-divider"/>
              <div className="crumb-dd-item action" onClick={() => { onNew(); setMenuOpen(false); }}>
                + New workflow
              </div>
            </div>
          )}
        </div>
        <span className="sep">/</span>
        {editing ? (
          <input
            ref={inputRef}
            className="crumb-input"
            value={nameBuf}
            onChange={(e) => setNameBuf(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameBuf(workflowName); setEditing(false); } }}
          />
        ) : (
          <span className="cur" onClick={() => setEditing(true)} title="Rename">
            {workflowName}
            {dirty ? <span className="crumb-dirty">*</span> : null}
          </span>
        )}
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
        <button className="tb-btn" onClick={onSave} disabled={saving || (!dirty && !!workflowId)} title="Save workflow">
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button className="tb-btn" onClick={onNew} title="New workflow">
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
        {workflowId && (
          <button className="tb-btn" onClick={() => onDelete(workflowId)} title="Delete workflow">
            <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        )}

        <span style={{ width: 8 }}/>
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
