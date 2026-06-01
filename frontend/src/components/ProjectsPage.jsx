import { useState, useEffect } from 'react';
import { api } from '../api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const PROVIDERS = [
  { id: 'ollama', label: 'Ollama (Local)', models: ['qwen3:8b'] },
  { id: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'] },
  { id: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'] },
  { id: 'opencode', label: 'Opencode', models: ['default'] },
];

export default function ProjectsPage({ onSelect, onLogout }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', provider: 'ollama', model: 'qwen3:8b' });

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.listWorkflows();
      setWorkflows(list);
    } catch {
      setWorkflows([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNewModal = () => {
    setForm({ name: '', description: '', provider: 'ollama', model: 'qwen3:8b' });
    setShowModal(true);
  };

  const handleCreate = async () => {
    try {
      const name = form.name.trim() || 'Untitled';
      const wf = await api.createWorkflow({ name, description: form.description });
      setShowModal(false);
      onSelect(wf.id, wf.name);
    } catch { /* ignore */ }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteWorkflow(id);
      await load();
    } catch (err) {
      setError(`Could not delete project: ${err.message}`);
    }
  };

  const currentProvider = PROVIDERS.find(p => p.id === form.provider);
  const currentModels = currentProvider?.models || [];

  return (
    <div className="projects-page">
      <div className="projects-bg">
        <div className="projects-orbit"/>
        <div className="projects-glow"/>
      </div>

      <div className="projects-header">
        <div className="projects-brand">
          <img src="/andromeda-logo.svg" alt="" className="projects-brand-img"/>
          <span>Andromeda.ai</span>
        </div>
        <button className="projects-btn ghost" onClick={onLogout}>Sign out</button>
      </div>

      <div className="projects-body">
        <div className="projects-top">
          <h1>Projects</h1>
          <button className="projects-btn primary" onClick={openNewModal}>
            + New Project
          </button>
        </div>
        {error && <div className="projects-error">{error}</div>}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>New Project</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <label className="modal-label">Project Name</label>
                <input className="modal-input" type="text" placeholder="My Workflow" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus/>

                <label className="modal-label">Description</label>
                <textarea className="modal-input modal-textarea" placeholder="What does this workflow do?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}/>

                <label className="modal-label">LLM Provider</label>
                <div className="modal-providers">
                  {PROVIDERS.map((p) => (
                    <button key={p.id} className={`modal-provider ${form.provider === p.id ? 'active' : ''}`} onClick={() => setForm({ ...form, provider: p.id, model: p.models[0] })}>
                      {p.label}
                    </button>
                  ))}
                </div>

                <label className="modal-label">Model</label>
                <select className="modal-input modal-select" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}>
                  {currentModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button className="projects-btn ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="projects-btn primary" onClick={handleCreate}>Create Project</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="projects-empty">Loading…</div>
        ) : workflows.length === 0 ? (
          <div className="projects-empty">
            <div className="projects-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </div>
            <h3>No projects yet</h3>
            <p>Create your first agent workflow to get started.</p>
            <button className="projects-btn primary" onClick={openNewModal}>
              Create your first project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {workflows.map((wf) => (
              <div key={wf.id} className="projects-card" onClick={() => onSelect(wf.id, wf.name)}>
                <button className="projects-card-delete" onClick={(e) => handleDelete(e, wf.id, wf.name)} title="Delete workflow">
                  <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
                <div className="projects-card-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                  </svg>
                </div>
                <div className="projects-card-name">{wf.name}</div>
                <div className="projects-card-meta">
                  {wf.agents?.length || 0} agents · {timeAgo(wf.updated_at || wf.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
