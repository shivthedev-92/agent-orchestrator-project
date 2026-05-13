import { useState } from 'react';

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic (Claude)', keyLabel: 'Claude API Key', placeholder: 'sk-ant-...' },
  { id: 'openai',    name: 'OpenAI (GPT)',       keyLabel: 'OpenAI API Key',  placeholder: 'sk-proj-...' },
  { id: 'opencode',  name: 'Opencode',            keyLabel: 'Opencode Key',    placeholder: 'oc-...' },
];

export default function ApiKeySetup({ onComplete, onSkip }) {
  const [keys, setKeys] = useState({});
  const [showKey, setShowKey] = useState({});

  const setKey = (provider, val) => setKeys((k) => ({ ...k, [provider]: val }));

  const allFilled = PROVIDERS.every((p) => keys[p.id]?.trim());

  const handleSave = () => {
    localStorage.setItem('andromeda_api_keys', JSON.stringify(keys));
    onComplete(keys);
  };

  return (
    <div className="apikeys-page">
      <div className="apikeys-bg">
        <div className="apikeys-orbit"/>
        <div className="apikeys-glow"/>
      </div>

      <div className="apikeys-card">
        <img src="/andromeda-logo.svg" alt="Andromeda" className="apikeys-brand-mark"/>

        <h2>Configure your LLM providers</h2>
        <p className="apikeys-sub">
          Bring your own API keys to power your agent workflows.
          Your keys are stored locally and never sent to our servers.
        </p>

        <div className="apikeys-list">
          {PROVIDERS.map((p) => (
            <div key={p.id} className="apikeys-row">
              <div className="apikeys-row-head">
                <span className="apikeys-provider-name">{p.name}</span>
                {keys[p.id]?.trim() && <span className="apikeys-check">Configured</span>}
              </div>
              <div className="apikeys-input-wrap">
                <input
                  type={showKey[p.id] ? 'text' : 'password'}
                  placeholder={p.placeholder}
                  value={keys[p.id] || ''}
                  onChange={(e) => setKey(p.id, e.target.value)}
                />
                <button
                  type="button"
                  className="apikeys-toggle"
                  onClick={() => setShowKey((s) => ({ ...s, [p.id]: !s[p.id] }))}
                >
                  {showKey[p.id] ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="apikeys-actions">
          <button className="apikeys-btn primary" disabled={!allFilled} onClick={handleSave}>
            Save & Continue
          </button>
          <button className="apikeys-btn ghost" onClick={onSkip}>
            Skip for now
          </button>
        </div>
        <p className="apikeys-footnote">
          You can always configure these later in Settings.
        </p>
      </div>
    </div>
  );
}
