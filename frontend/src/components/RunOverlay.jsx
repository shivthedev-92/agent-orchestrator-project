export default function RunOverlay({ running, backendRunning, agents, runOrder, runStep, runElapsed, log, workflowInput, onWorkflowInput }) {
  const active = running || backendRunning;
  const stages = runOrder.length || 1;
  return (
    <div className="run-overlay">
      <div className="run-card">
        <div className="run-title">
          <b>{active ? 'Running orchestration' : 'Workflow input'}</b>
          {active && <span className="timer">{runElapsed.toFixed(1)}s</span>}
        </div>
        <textarea
          className="run-input"
          placeholder="Paste the text or task for the first agent in your workflow..."
          value={workflowInput}
          onChange={(e) => onWorkflowInput(e.target.value)}
          disabled={active}
        />
        {active && (
          <div className="run-stages">
            {Array.from({ length: stages }).map((_, i) => (
              <div key={i} className={`run-stage ${i < runStep ? 'done' : i === runStep && running ? 'active' : ''}`}/>
            ))}
          </div>
        )}
      </div>

      <div className="run-log">
        {log.length === 0 ? (
          <div className="run-log-empty">Terminal ready. Add workflow input and run your agents to see live output.</div>
        ) : log.slice(-12).map((l, i) => (
          <div key={i} className="run-log-entry">
            <span className="ts">{l.t}</span>
            <span className="who">{l.who}</span>
            <span> </span>
            <span className={l.kind === 'ok' ? 'ok' : l.kind === 'err' ? 'err' : ''}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
