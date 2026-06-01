import RobotAvatar from './RobotAvatar';
import { MODELS } from '../data/models';
import { SKILL_BANK } from '../data/skills';

export default function Inspector({ agents, selectedId, onSelect, agent, onChange, onDelete, onChangeAvatarSeed, connectionsCount }) {
  const projectAgents = (
    <div className="project-agents">
      <div className="project-agents-head">
        <span>Project Agents</span>
        <span className="project-agents-count mono">{agents.length}</span>
      </div>
      <div className="project-agents-list">
        {agents.length === 0 ? (
          <div className="project-agents-empty">No agents added to this project yet.</div>
        ) : agents.map((item) => (
          <button
            key={item.id}
            className={`project-agent ${selectedId === item.id ? 'active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <RobotAvatar seed={item.avatarSeed} size={28}/>
            <span className="project-agent-meta">
              <span className="project-agent-name">{item.name}</span>
              <span className="project-agent-role">{item.role || 'No role assigned'}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  if (!agent) {
    return (
      <aside className="inspector">
        {projectAgents}
        <div className="insp-empty">
          <div>
            <div className="glyph">
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" fill="none">
                <rect x="3" y="4" width="18" height="14" rx="3"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="8" y1="14" x2="16" y2="14"/>
              </svg>
            </div>
            <div className="t">Nothing selected</div>
            <div className="s">Click an agent or a connection on the canvas to edit.</div>
          </div>
        </div>
      </aside>
    );
  }

  const toggleSkill = (s) => {
    const next = agent.skills.includes(s)
      ? agent.skills.filter(x => x !== s)
      : [...agent.skills, s];
    onChange({ skills: next });
  };

  const seeds = [agent.id, agent.id + '-1', agent.id + '-2', agent.id + '-3', agent.id + '-4', agent.id + '-5'];

  return (
    <aside className="inspector">
      {projectAgents}
      <div className="insp-head">
        <div className="av"><RobotAvatar seed={agent.avatarSeed} size={48}/></div>
        <div className="id">
          <div className="name">
            <input value={agent.name} onChange={(e) => onChange({ name: e.target.value })}/>
          </div>
          <div className="role">
            <input value={agent.role} onChange={(e) => onChange({ role: e.target.value })}/>
          </div>
        </div>
        <button className="tb-btn icon" title="Delete agent" onClick={onDelete}>
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>

      <div className="insp-body">
        <div className="fld">
          <div className="fld-label"><span>Avatar</span><span className="hint">click to reroll</span></div>
          <div className="av-pick">
            {seeds.map(seed => (
              <button key={seed}
                      className={`av-tile ${agent.avatarSeed === seed ? 'active' : ''}`}
                      onClick={() => onChangeAvatarSeed(seed)}>
                <RobotAvatar seed={seed} size={40}/>
              </button>
            ))}
          </div>
        </div>

        <div className="fld">
          <div className="fld-label"><span>Model</span></div>
          <div className="model-grid">
            {MODELS.map(m => (
              <button key={m.id}
                      className={`model-tile ${agent.model === m.id ? 'active' : ''}`}
                      onClick={() => onChange({ model: m.id, modelProvider: m.provider })}>
                <div className="mt-name">{m.name}</div>
                <div className="mt-meta">{m.meta}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="fld">
          <div className="fld-label">
            <span>System prompt</span>
            <span className="hint">{agent.prompt.length} chars</span>
          </div>
          <textarea
            value={agent.prompt}
            placeholder="Describe what this agent should do…"
            onChange={(e) => onChange({ prompt: e.target.value })}
          />
        </div>

        <div className="fld">
          <div className="fld-label"><span>Skills</span><span className="hint">{agent.skills.length} active</span></div>
          <div className="skill-row">
            {SKILL_BANK.slice(0, 22).map(s => (
              <button key={s}
                      className={`skill-pill ${agent.skills.includes(s) ? 'on' : ''}`}
                      onClick={() => toggleSkill(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="fld">
          <div className="fld-label"><span>Attributes</span></div>
          <div className="attr-row">
            <span className="attr-label">Temperature</span>
            <span className="attr-val">{agent.temperature.toFixed(2)}</span>
          </div>
          <input className="range" type="range" min="0" max="1" step="0.05"
                 value={agent.temperature}
                 onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}/>
          <div className="attr-row" style={{ marginTop: 6 }}>
            <span className="attr-label">Max tokens</span>
            <span className="attr-val">{agent.maxTokens}</span>
          </div>
          <input className="range" type="range" min="256" max="8192" step="128"
                 value={agent.maxTokens}
                 onChange={(e) => onChange({ maxTokens: parseInt(e.target.value) })}/>
          <div className="attr-row" style={{ marginTop: 6 }}>
            <span className="attr-label">Retries</span>
            <span className="attr-val">{agent.retries}</span>
          </div>
          <input className="range" type="range" min="0" max="5" step="1"
                 value={agent.retries}
                 onChange={(e) => onChange({ retries: parseInt(e.target.value) })}/>
        </div>

        <div className="fld">
          <div className="fld-label"><span>I/O schema</span></div>
          <select value={agent.outputSchema} onChange={(e) => onChange({ outputSchema: e.target.value })}>
            <option value="freeform">Freeform text</option>
            <option value="json">Strict JSON</option>
            <option value="rows">Tabular rows</option>
            <option value="binary">Binary blob</option>
          </select>
        </div>

        <div className="fld">
          <div className="fld-label"><span>Connections</span><span className="hint">{connectionsCount} edges</span></div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-dim)', lineHeight: 1.5 }}>
            Drag from the right port of this card to another agent's left port to relay messages.
          </div>
        </div>
      </div>
    </aside>
  );
}
