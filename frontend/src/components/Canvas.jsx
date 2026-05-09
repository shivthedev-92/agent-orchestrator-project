import React from 'react';
import RobotAvatar from './RobotAvatar';
import { MODELS } from '../data/models';

function curvePath(x1, y1, x2, y2, style = 'curved') {
  if (style === 'straight') {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  if (style === 'stepped') {
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
  }
  const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

const PORT_OFFSET_Y = 38;

export function getPortPositions(agent, density) {
  const w = density === 'compact' ? 200 : 240;
  const inX  = agent.x;
  const outX = agent.x + w;
  const y    = agent.y + PORT_OFFSET_Y;
  return { in: { x: inX, y }, out: { x: outX, y }, w };
}

function AgentCard({ agent, selected, onSelect, onDragMove, density, runStatus, runDuration, onPortDown, onPortUp }) {
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.port') || e.target.closest('.agent-menu') || e.target.closest('input,textarea,button')) return;
    e.stopPropagation();
    onSelect(agent.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const ax = agent.x, ay = agent.y;
    const onMove = (ev) => onDragMove(agent.id, ax + (ev.clientX - startX), ay + (ev.clientY - startY));
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const skills = agent.skills.slice(0, 3);
  const moreSkills = agent.skills.length - skills.length;
  const model = MODELS.find(m => m.id === agent.model);

  return (
    <div
      className={`agent ${selected ? 'selected' : ''} ${runStatus || ''} ${density}`}
      style={{ left: agent.x, top: agent.y }}
      onClick={(e) => { e.stopPropagation(); onSelect(agent.id); }}
    >
      <div className="port in"
           onMouseDown={(e) => { e.stopPropagation(); onPortDown(e, agent.id, 'in'); }}
           onMouseUp={(e)   => { e.stopPropagation(); onPortUp(e, agent.id, 'in'); }} />
      <div className="port out"
           onMouseDown={(e) => { e.stopPropagation(); onPortDown(e, agent.id, 'out'); }}
           onMouseUp={(e)   => { e.stopPropagation(); onPortUp(e, agent.id, 'out'); }} />

      <div className="agent-head" onMouseDown={onMouseDown}>
        <div className="agent-av">
          <RobotAvatar seed={agent.avatarSeed} size={38}/>
          <span className="status-dot"/>
        </div>
        <div className="agent-id">
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
        </div>
        <button className="agent-menu" title="More">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
        </button>
      </div>

      <div className="agent-body">
        {agent.prompt && <div className="agent-prompt">{agent.prompt}</div>}
        <div className="agent-meta-row">
          <span className="chip mono">{model ? model.name : 'no model'}</span>
          {skills.map(s => <span key={s} className="chip skill">{s}</span>)}
          {moreSkills > 0 && <span className="chip mono">+{moreSkills}</span>}
        </div>
      </div>

      <div className="agent-foot">
        <span className="mono">{agent.shortId}</span>
        <span className={`runtime-time ${runStatus === 'running' ? 'live' : ''}`}>
          {runStatus === 'done' ? `${runDuration}ms` : runStatus === 'running' ? 'thinking…' : 'idle'}
        </span>
      </div>
    </div>
  );
}

function Connection({ conn, agents, density, connStyle, selected, onSelect, runActive, particleProgress }) {
  const from = agents.find(a => a.id === conn.fromId);
  const to = agents.find(a => a.id === conn.toId);
  if (!from || !to) return null;
  const fp = getPortPositions(from, density);
  const tp = getPortPositions(to, density);
  const d = curvePath(fp.out.x, fp.out.y, tp.in.x, tp.in.y, connStyle);

  const pathRef = React.useRef(null);
  const [pt, setPt] = React.useState(null);
  React.useEffect(() => {
    if (!runActive || !pathRef.current) { setPt(null); return; }
    const len = pathRef.current.getTotalLength();
    if (!len) return;
    const p = pathRef.current.getPointAtLength(len * particleProgress);
    setPt(p);
  }, [runActive, particleProgress, d]);

  const labelX = (fp.out.x + tp.in.x) / 2;
  const labelY = (fp.out.y + tp.in.y) / 2 - 4;

  return (
    <g onClick={(e) => { e.stopPropagation(); onSelect(conn.id); }}>
      <path ref={pathRef} className={`conn-path ${selected ? 'selected' : ''}`} d={d}/>
      <path className="conn-hit" d={d}/>
      {conn.label && <text className="conn-label" x={labelX} y={labelY} textAnchor="middle">{conn.label}</text>}
      {pt && <circle className="conn-flow" cx={pt.x} cy={pt.y} r="4"/>}
      {pt && <circle className="conn-flow" cx={pt.x} cy={pt.y} r="9" opacity="0.18"/>}
    </g>
  );
}

function CanvasTools({ view, setView, wrapRef, agents }) {
  const z = Math.round(view.k * 100);
  const zoomBy = (f) => {
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    setView((v) => {
      const k = Math.min(2, Math.max(0.4, v.k * f));
      const x = cx - (cx - v.x) * (k / v.k);
      const y = cy - (cy - v.y) * (k / v.k);
      return { x, y, k };
    });
  };
  const reset = () => setView({ x: 60, y: 40, k: 1 });

  const minX = -200, minY = -200, w = 1800, h = 1200;
  const wrapRect = wrapRef.current?.getBoundingClientRect();
  const mmScale = 200 / w;

  return (
    <div className="canvas-tools">
      <div className="mini-map">
        {agents.map(a => (
          <div key={a.id} className="mm-node"
               style={{
                 left: (a.x - minX) * mmScale,
                 top: (a.y - minY) * (120 / h),
                 width: 240 * mmScale,
                 height: 90 * (120 / h),
               }}/>
        ))}
        {wrapRect && (
          <div className="mm-vp" style={{
            left: (-view.x / view.k - minX) * mmScale,
            top: (-view.y / view.k - minY) * (120 / h),
            width: (wrapRect.width / view.k) * mmScale,
            height: (wrapRect.height / view.k) * (120 / h),
          }}/>
        )}
      </div>
      <div className="zoom-tools">
        <button title="Zoom out" onClick={() => zoomBy(0.85)}>
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="6" y1="12" x2="18" y2="12"/></svg>
        </button>
        <span className="val">{z}%</span>
        <button title="Zoom in" onClick={() => zoomBy(1.18)}>
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="6" y1="12" x2="18" y2="12"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
        </button>
        <button title="Fit" onClick={reset}>
          <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg>
        </button>
      </div>
    </div>
  );
}

export default function Canvas({
  agents, connections, selectedId, onSelect, onUpdateAgent,
  onAddConnection, onAddAgentAt, density, connStyle, bgPattern,
  running, runStep, runProgress, runDoneIds,
}) {
  const wrapRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [view, setView] = React.useState({ x: 60, y: 40, k: 1 });
  const [panning, setPanning] = React.useState(false);
  const [dropping, setDropping] = React.useState(false);
  const [drag, setDrag] = React.useState(null);

  const toStage = React.useCallback((cx, cy) => {
    const rect = wrapRef.current.getBoundingClientRect();
    return {
      x: (cx - rect.left - view.x) / view.k,
      y: (cy - rect.top - view.y) / view.k,
    };
  }, [view]);

  const onMouseDown = (e) => {
    if (e.target !== wrapRef.current && e.target !== stageRef.current && !e.target.classList.contains('canvas') && !e.target.classList.contains('canvas-bg')) return;
    if (e.button !== 0) return;
    setPanning(true);
    onSelect(null);
    const sx = e.clientX, sy = e.clientY;
    const v0 = view;
    const onMove = (ev) => setView({ ...v0, x: v0.x + (ev.clientX - sx), y: v0.y + (ev.clientY - sy) });
    const onUp = () => {
      setPanning(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onWheel = (e) => {
    if (!e.ctrlKey && !e.metaKey) {
      setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }));
      return;
    }
    e.preventDefault();
    const rect = wrapRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.0015);
    setView((v) => {
      const k = Math.min(2, Math.max(0.4, v.k * factor));
      const x = cx - (cx - v.x) * (k / v.k);
      const y = cy - (cy - v.y) * (k / v.k);
      return { x, y, k };
    });
  };

  const onDragOver = (e) => { e.preventDefault(); setDropping(true); };
  const onDragLeave = () => setDropping(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDropping(false);
    const data = e.dataTransfer.getData('application/x-agent');
    if (!data) return;
    const tpl = JSON.parse(data);
    const p = toStage(e.clientX, e.clientY);
    onAddAgentAt(tpl, p.x - 120, p.y - 50);
  };

  const onPortDown = (e, agentId, kind) => {
    if (kind !== 'out') return;
    const p = toStage(e.clientX, e.clientY);
    setDrag({ fromId: agentId, fromKind: kind, x: p.x, y: p.y });
    const onMove = (ev) => {
      const pt = toStage(ev.clientX, ev.clientY);
      setDrag((d) => d ? { ...d, x: pt.x, y: pt.y } : null);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setDrag(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const onPortUp = (e, agentId, kind) => {
    if (!drag) return;
    if (kind !== 'in') return;
    if (agentId === drag.fromId) return;
    onAddConnection(drag.fromId, agentId);
    setDrag(null);
  };

  const bbox = React.useMemo(() => {
    return { minX: -2000, minY: -2000, w: 4000, h: 4000 };
  }, []);

  let dragLine = null;
  if (drag) {
    const a = agents.find(x => x.id === drag.fromId);
    if (a) {
      const fp = getPortPositions(a, density);
      const d = curvePath(fp.out.x, fp.out.y, drag.x, drag.y, connStyle);
      dragLine = <path className="dragline" d={d}/>;
    }
  }

  const bgStyle = {
    backgroundSize: `${22 * view.k}px ${22 * view.k}px, ${22 * view.k}px ${22 * view.k}px`,
    backgroundPosition: `${view.x}px ${view.y}px`,
  };
  const gridStyle = {
    backgroundSize: `${44 * view.k}px ${44 * view.k}px`,
    backgroundPosition: `${view.x}px ${view.y}px`,
  };

  const runOrder = React.useMemo(() => {
    const incoming = {}; agents.forEach(a => incoming[a.id] = 0);
    connections.forEach(c => { if (incoming[c.toId] !== undefined) incoming[c.toId]++; });
    const visited = []; const queue = agents.filter(a => incoming[a.id] === 0).map(a => a.id);
    const inc = { ...incoming };
    while (queue.length) {
      const n = queue.shift();
      if (visited.includes(n)) continue;
      visited.push(n);
      connections.filter(c => c.fromId === n).forEach(c => {
        inc[c.toId]--;
        if (inc[c.toId] === 0) queue.push(c.toId);
      });
    }
    agents.forEach(a => { if (!visited.includes(a.id)) visited.push(a.id); });
    return visited;
  }, [agents, connections]);

  function statusFor(id) {
    if (!running) return runDoneIds.includes(id) ? 'done' : '';
    const idx = runOrder.indexOf(id);
    if (idx < runStep) return 'done';
    if (idx === runStep) return 'running';
    return '';
  }
  function durationFor(id) {
    return 200 + ((id.charCodeAt(id.length - 1) * 37) % 1800);
  }

  return (
    <div
      className="canvas-wrap"
      ref={wrapRef}
      onWheel={onWheel}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className={`canvas-bg ${bgPattern}`}
        style={bgPattern === 'grid' ? gridStyle : bgPattern === 'dots' ? bgStyle : {}}
      />
      <div
        className={`canvas ${panning ? 'panning' : ''} ${dropping ? 'dropping' : ''}`}
        onMouseDown={onMouseDown}
      >
        <div
          className="canvas-stage"
          ref={stageRef}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
        >
          <svg className="conn-layer"
               style={{ left: bbox.minX, top: bbox.minY, width: bbox.w, height: bbox.h }}
               viewBox={`${bbox.minX} ${bbox.minY} ${bbox.w} ${bbox.h}`}
               preserveAspectRatio="xMinYMin meet"
          >
            {connections.map(c => (
              <Connection key={c.id}
                          conn={c} agents={agents} density={density} connStyle={connStyle}
                          selected={selectedId === c.id}
                          onSelect={onSelect}
                          runActive={running && (statusFor(c.fromId) === 'done' || statusFor(c.fromId) === 'running')}
                          particleProgress={runProgress}
              />
            ))}
            {dragLine}
          </svg>

          {agents.map(a => (
            <AgentCard
              key={a.id}
              agent={a}
              density={density}
              selected={selectedId === a.id}
              onSelect={onSelect}
              onDragMove={(id, x, y) => onUpdateAgent(id, { x, y })}
              runStatus={statusFor(a.id)}
              runDuration={durationFor(a.id)}
              onPortDown={onPortDown}
              onPortUp={onPortUp}
            />
          ))}
        </div>
      </div>

      <CanvasTools
        view={view}
        setView={setView}
        wrapRef={wrapRef}
        agents={agents}
      />
    </div>
  );
}
