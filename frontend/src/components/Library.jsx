import React, { useState, useEffect } from 'react';
import RobotAvatar from './RobotAvatar';
import { AGENT_TEMPLATES } from '../data/templates';
import { MODELS } from '../data/models';

const STORAGE_KEY = 'andromeda_custom_agents';

function loadCustom() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveCustom(agents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

const EMPTY_FORM = {
  name: '', role: '', prompt: '',
  model: 'sonnet-4', skills: [], skillsText: '',
  temperature: 0.4, maxTokens: 2048,
};

let _customId = Date.now();
function nextCustomId() { return 'custom-' + (_customId++).toString(36); }

export default function Library({ query, onQuery, tab, onTab, onStartDrag, onSpawnAt, open, onToggle, createTrigger }) {
  const [customAgents, setCustomAgents] = useState(loadCustom);
  const [showForm, setShowForm] = useState(false);
  const [activeView, setActiveView] = useState('marketplace');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { saveCustom(customAgents); }, [customAgents]);

  useEffect(() => {
    if (createTrigger > 0) {
      setForm({ ...EMPTY_FORM, model: 'sonnet-4' });
      setEditingId(null);
      setShowForm(true);
      setActiveView('create');
    }
  }, [createTrigger]);

  const allTemplates = React.useMemo(() => {
    const customEntries = customAgents.map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      group: 'Custom',
      tag: 'USER',
      defaultModel: a.model,
      defaultModelProvider: MODELS.find(m => m.id === a.model)?.provider || 'anthropic',
      skills: a.skills,
      prompt: a.prompt,
      defaultTemperature: a.temperature,
      defaultMaxTokens: a.maxTokens,
      _custom: true,
    }));
    return [...AGENT_TEMPLATES, ...customEntries];
  }, [customAgents]);

  const hasCustom = customAgents.length > 0;

  const groups = React.useMemo(() => {
    const filtered = allTemplates.filter(t => {
      if (activeView === 'marketplace' && t._custom) return false;
      if (activeView === 'my-agents' && !t._custom) return false;
      if (activeView === 'marketplace' && tab !== 'all' && t.group !== tab) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return t.name.toLowerCase().includes(q)
          || t.role.toLowerCase().includes(q)
          || t.skills.some(s => s.toLowerCase().includes(q));
    });
    const map = {};
    for (const t of filtered) (map[t.group] ||= []).push(t);
    return map;
  }, [activeView, allTemplates, query, tab]);

  const TABS = [
    'all',
    ...(hasCustom ? ['Custom'] : []),
    'Software Development',
    'Testing & QA', 'Data Engineering', 'DevOps', 'Scrum & Agile',
  ];

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, model: 'sonnet-4' });
    setEditingId(null);
    setShowForm(true);
    setActiveView('create');
  };

  const openEdit = (e, agent) => {
    e.stopPropagation();
    setForm({
      name: agent.name,
      role: agent.role,
      prompt: agent.prompt,
      model: agent.defaultModel,
      skills: [...agent.skills],
      skillsText: agent.skills.join(', '),
      temperature: agent.temperature || 0.4,
      maxTokens: agent.maxTokens || 2048,
    });
    setEditingId(agent.id);
    setShowForm(true);
    setActiveView('create');
  };

  const handleSave = () => {
    const name = form.name.trim() || 'Untitled Agent';
    const skills = form.skillsText.split(',').map((skill) => skill.trim()).filter(Boolean);
    if (editingId) {
      setCustomAgents((prev) => prev.map((a) =>
        a.id === editingId ? { ...a, name, role: form.role, prompt: form.prompt, model: form.model, skills, temperature: form.temperature, maxTokens: form.maxTokens } : a
      ));
    } else {
      const entry = {
        id: nextCustomId(),
        name,
        role: form.role,
        prompt: form.prompt,
        model: form.model,
        skills,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
      };
      setCustomAgents((prev) => [...prev, entry]);
    }
    setShowForm(false);
    setActiveView('my-agents');
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this custom agent?')) return;
    setCustomAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const updateRecommendedSkills = (value) => {
    setForm((current) => ({ ...current, skillsText: value }));
  };

  return (
    <aside className={`library${open ? '' : ' closed'}`}>
      <button className="lib-toggle" onClick={onToggle} title={open ? 'Close agent library' : 'Open agent library'}>
        {open ? (
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.07a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.06a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        )}
      </button>

      <div className="lib-mode-tabs">
        <button className={`lib-mode-tab ${activeView === 'create' ? 'active' : ''}`} onClick={openCreate}>Create Agent</button>
        <button className={`lib-mode-tab ${activeView === 'my-agents' ? 'active' : ''}`} onClick={() => { setActiveView('my-agents'); setShowForm(false); }}>My Agents</button>
        <button className={`lib-mode-tab ${activeView === 'marketplace' ? 'active' : ''}`} onClick={() => { setActiveView('marketplace'); setShowForm(false); }}>Marketplace</button>
      </div>

      {activeView === 'create' && showForm ? (
        <div className="lib-create-form">
          <div className="lib-create-head">
            <h3>{editingId ? 'Edit Agent' : 'Create Agent'}</h3>
            <button className="lib-create-back" onClick={() => { setShowForm(false); setActiveView('marketplace'); }} title="Back">
              <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="lib-create-fields">
            <label className="lib-cf-label">Agent Name</label>
            <input className="lib-cf-input" type="text" placeholder="My Custom Agent" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus/>

            <label className="lib-cf-label">Role</label>
            <input className="lib-cf-input" type="text" placeholder="What does it do?" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}/>

            <label className="lib-cf-label">System Prompt</label>
            <textarea className="lib-cf-input lib-cf-textarea" placeholder="Describe what this agent should do…" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} rows={4}/>

            <label className="lib-cf-label">Model</label>
            <select className="lib-cf-input lib-cf-select" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.meta}</option>
              ))}
            </select>

            <label className="lib-cf-label">Recommended Skills</label>
            <input
              className="lib-cf-input"
              type="text"
              placeholder="Code, Review, Debug"
              value={form.skillsText}
              onChange={(e) => updateRecommendedSkills(e.target.value)}
            />
            <div className="lib-cf-help">Add a few relevant skills, separated by commas.</div>

            <label className="lib-cf-label">Temperature: {form.temperature.toFixed(2)}</label>
            <input className="range" type="range" min="0" max="1" step="0.05" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}/>

            <label className="lib-cf-label">Max Tokens: {form.maxTokens}</label>
            <input className="range" type="range" min="256" max="8192" step="128" value={form.maxTokens} onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}/>
          </div>

          <div className="lib-create-actions">
            <button className="lib-cf-btn secondary" onClick={() => { setShowForm(false); setActiveView('marketplace'); }}>Cancel</button>
            <button className="lib-cf-btn primary" onClick={handleSave}>{editingId ? 'Save' : 'Create'}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="lib-search">
            <svg className="icon-search" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
            </svg>
            <input placeholder="Search agents…" value={query} onChange={(e) => onQuery(e.target.value)} />
          </div>

          {activeView === 'marketplace' && (
            <div className="lib-tabs">
              {TABS.filter(t => t !== 'Custom').map(t => (
                <button key={t} className={`lib-tab ${tab === t ? 'active' : ''}`} onClick={() => onTab(t)}>
                  {t === 'all' ? 'All' : t.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

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
                    {t._custom && (
                      <div className="lib-card-actions">
                        <button className="lib-card-edit" onClick={(e) => openEdit(e, t)} title="Edit">
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="lib-card-del" onClick={(e) => handleDelete(e, t.id)} title="Delete">
                          <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    )}
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
            <button className="lib-create-btn" onClick={openCreate}>
              <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Agent
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
