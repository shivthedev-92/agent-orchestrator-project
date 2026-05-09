import React from 'react';
import RobotAvatar from './RobotAvatar';
import { AGENT_TEMPLATES } from '../data/templates';

export default function Library({ query, onQuery, tab, onTab, onStartDrag, onSpawnAt }) {
  const groups = React.useMemo(() => {
    const filtered = AGENT_TEMPLATES.filter(t => {
      if (tab !== 'all' && t.group !== tab) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return t.name.toLowerCase().includes(q)
          || t.role.toLowerCase().includes(q)
          || t.skills.some(s => s.toLowerCase().includes(q));
    });
    const map = {};
    for (const t of filtered) (map[t.group] ||= []).push(t);
    return map;
  }, [query, tab]);

  const TABS = ['all', 'Data Pipeline', 'Travel', 'Control Flow', 'Communication', 'Research'];

  return (
    <aside className="library">
      <div className="lib-search">
        <svg className="icon-search" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
        </svg>
        <input placeholder="Search agents…" value={query} onChange={(e) => onQuery(e.target.value)} />
      </div>

      <div className="lib-tabs">
        {TABS.map(t => (
          <button key={t} className={`lib-tab ${tab === t ? 'active' : ''}`} onClick={() => onTab(t)}>
            {t === 'all' ? 'All' : t.split(' ')[0]}
          </button>
        ))}
      </div>

      <div className="lib-list">
        {Object.entries(groups).map(([grp, items]) => (
          <div key={grp}>
            <div className="lib-group-label">{grp}</div>
            {items.map(t => (
              <div key={t.id}
                   className="lib-card"
                   draggable
                   onDragStart={(e) => onStartDrag(e, t)}
                   onDoubleClick={() => onSpawnAt(t)}
                   title="Drag to canvas, or double-click to add">
                <div className="lib-av">
                  <RobotAvatar seed={t.id} size={32}/>
                </div>
                <div className="lib-meta">
                  <div className="lib-name">{t.name}</div>
                  <div className="lib-role">{t.role}</div>
                </div>
                <span className="lib-tag mono">{t.tag}</span>
              </div>
            ))}
          </div>
        ))}
        {Object.keys(groups).length === 0 && (
          <div style={{ color: 'var(--fg-faint)', fontSize: 12, padding: 24, textAlign: 'center' }}>
            No agents match &ldquo;{query}&rdquo;.
          </div>
        )}
      </div>

      <div className="lib-foot">
        <span>Drag onto canvas</span>
        <span className="kbd">⌘ + N</span>
      </div>
    </aside>
  );
}
