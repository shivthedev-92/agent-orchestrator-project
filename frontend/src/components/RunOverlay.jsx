export default function RunOverlay({ running, agents, runOrder, runStep, runElapsed, log }) {
  if (!running && log.length === 0) return null;
  const stages = runOrder.length || 1;
  return (
    <div className="run-overlay">
      <div className="run-card">
        <div className="run-title">
          <b>{running ? 'Running orchestration' : 'Last run'}</b>
          <span className="timer">{runElapsed.toFixed(1)}s</span>
        </div>
        <div className="run-stages">
          {Array.from({ length: stages }).map((_, i) => (
            <div key={i} className={`run-stage ${i < runStep ? 'done' : i === runStep && running ? 'active' : ''}`}/>
          ))}
        </div>
      </div>

      {log.length > 0 && (
        <div className="run-log">
          {log.slice(-8).map((l, i) => (
            <div key={i}>
              <span className="ts">{l.t}</span>
              <span className="who">{l.who}</span>
              <span> </span>
              <span className={l.kind === 'ok' ? 'ok' : l.kind === 'err' ? 'err' : ''}>{l.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
