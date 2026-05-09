import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import TopBar from './components/TopBar';
import Library from './components/Library';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import RunOverlay from './components/RunOverlay';
import { TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakButton, useTweaks } from './components/TweaksPanel';
import { AGENT_TEMPLATES } from './data/templates';

const TWEAK_DEFAULTS = {
  "theme": "dark",
  "accentHue": 262,
  "density": "regular",
  "connStyle": "curved",
  "bgPattern": "dots",
  "runStyle": "particles"
};

let _agentCounter = 1;
function newAgentId() { return 'a-' + (_agentCounter++).toString(36).padStart(3, '0'); }
function shortId(id) { return id.toUpperCase().replace('A-', '#'); }

function makeAgent(tpl, x, y, idOverride) {
  const id = idOverride || newAgentId();
  return {
    id,
    shortId: shortId(id),
    templateId: tpl.id,
    avatarSeed: tpl.id + '-' + Math.floor(Math.random() * 1000),
    name: tpl.name,
    role: tpl.role,
    model: tpl.defaultModel,
    skills: [...tpl.skills],
    prompt: tpl.prompt,
    temperature: 0.4,
    maxTokens: 2048,
    retries: 1,
    outputSchema: 'freeform',
    x, y,
  };
}

function buildSeed() {
  const T = (id) => AGENT_TEMPLATES.find(t => t.id === id);
  const a1 = makeAgent(T('tpl-research'),  60,   60, 'a-001');
  a1.name = 'Brief Reader'; a1.role = 'Parses request';
  a1.prompt = 'Read the user\'s request. Extract: origin, destination, dates, traveler count, budget, preferences.';
  a1.skills = ['Search','Summary'];
  a1.avatarSeed = 'brief-001';

  const a2 = makeAgent(T('tpl-flight'), 360, 20, 'a-002');
  a2.name = 'Flight Scout';
  a2.avatarSeed = 'flight-002';

  const a3 = makeAgent(T('tpl-hotel'),  360, 220, 'a-003');
  a3.name = 'Hotel Curator';
  a3.avatarSeed = 'hotel-003';

  const a4 = makeAgent(T('tpl-itinerary'), 700, 120, 'a-004');
  a4.name = 'Itinerary Planner';
  a4.avatarSeed = 'itin-004';

  const a5 = makeAgent(T('tpl-human'), 700, 360, 'a-005');
  a5.name = 'Human Approval';
  a5.avatarSeed = 'human-005';

  const a6 = makeAgent(T('tpl-booker'), 1020, 240, 'a-006');
  a6.avatarSeed = 'book-006';

  const a7 = makeAgent(T('tpl-summarizer'), 1340, 240, 'a-007');
  a7.name = 'Trip Briefer';
  a7.avatarSeed = 'sum-007';

  const cs = [
    { id: 'c1', fromId: 'a-001', toId: 'a-002', label: 'flight req' },
    { id: 'c2', fromId: 'a-001', toId: 'a-003', label: 'hotel req' },
    { id: 'c3', fromId: 'a-002', toId: 'a-004', label: 'options' },
    { id: 'c4', fromId: 'a-003', toId: 'a-004', label: 'options' },
    { id: 'c5', fromId: 'a-004', toId: 'a-005', label: 'plan' },
    { id: 'c6', fromId: 'a-005', toId: 'a-006', label: 'approved' },
    { id: 'c7', fromId: 'a-006', toId: 'a-007', label: 'confirmation' },
  ];

  _agentCounter = 8;
  return { agents: [a1, a2, a3, a4, a5, a6, a7], connections: cs };
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => { document.documentElement.setAttribute('data-theme', t.theme); }, [t.theme]);
  useEffect(() => { document.documentElement.style.setProperty('--accent-h', t.accentHue); }, [t.accentHue]);

  const seed = useMemo(buildSeed, []);
  const [agents, setAgents] = useState(seed.agents);
  const [connections, setConnections] = useState(seed.connections);
  const [selectedId, setSelectedId] = useState('a-004');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [dirty, setDirty] = useState(false);

  const [running, setRunning] = useState(false);
  const [runStep, setRunStep] = useState(0);
  const [runProgress, setRunProgress] = useState(0);
  const [runDoneIds, setRunDoneIds] = useState([]);
  const [runElapsed, setRunElapsed] = useState(0);
  const [log, setLog] = useState([]);
  const runRef = useRef({ raf: 0, t0: 0, stepStart: 0 });

  const runOrder = useMemo(() => {
    const incoming = {}; agents.forEach(a => incoming[a.id] = 0);
    connections.forEach(c => { if (incoming[c.toId] !== undefined) incoming[c.toId]++; });
    const queue = agents.filter(a => incoming[a.id] === 0).map(a => a.id);
    const visited = []; const inc = { ...incoming };
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

  const startRun = () => {
    setRunning(true);
    setRunStep(0);
    setRunProgress(0);
    setRunDoneIds([]);
    setLog([]);
    runRef.current.t0 = performance.now();
    runRef.current.stepStart = performance.now();
    pushLog('orchestrator', 'starting workflow', 'ok');
  };
  const stopRun = () => {
    setRunning(false);
    cancelAnimationFrame(runRef.current.raf);
    setRunDoneIds(runOrder.slice(0, runStep));
    pushLog('orchestrator', 'halted', 'err');
  };

  const pushLog = (who, msg, kind) => {
    const d = new Date();
    const ts = `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}.${d.getMilliseconds().toString().padStart(3,'0').slice(0,3)}`;
    setLog((L) => [...L, { t: ts, who, msg, kind }]);
  };

  useEffect(() => {
    if (!running) return;
    const STEP_MS = 1400;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - runRef.current.t0) / 1000;
      setRunElapsed(elapsed);
      const since = now - runRef.current.stepStart;
      const p = Math.min(1, since / STEP_MS);
      setRunProgress(p);
      if (p >= 1) {
        const doneId = runOrder[runStep];
        if (doneId) {
          const a = agents.find(x => x.id === doneId);
          pushLog(a?.name || doneId, randomCompletionMsg(a), 'ok');
        }
        if (runStep >= runOrder.length - 1) {
          setRunning(false);
          setRunStep(runOrder.length);
          setRunDoneIds([...runOrder]);
          pushLog('orchestrator', `complete in ${elapsed.toFixed(2)}s`, 'ok');
          return;
        }
        const nextStep = runStep + 1;
        setRunStep(nextStep);
        setRunProgress(0);
        runRef.current.stepStart = now;
        const nextAgent = agents.find(x => x.id === runOrder[nextStep]);
        if (nextAgent) pushLog(nextAgent.name, randomStartMsg(nextAgent), '');
      }
      runRef.current.raf = requestAnimationFrame(tick);
    };
    if (runStep === 0) {
      const a0 = agents.find(x => x.id === runOrder[0]);
      if (a0) pushLog(a0.name, randomStartMsg(a0), '');
    }
    runRef.current.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(runRef.current.raf);
  }, [running, runStep, agents, runOrder]);

  function randomStartMsg(a) {
    if (!a) return 'starting…';
    const opts = {
      'Brief Reader': 'parsing user request…',
      'Flight Scout': 'querying SkyScanner + Kayak APIs',
      'Hotel Curator': 'shortlisting 14 properties under budget',
      'Itinerary Planner': 'composing 5-day plan',
      'Human Approval': 'awaiting approval (auto-approved in demo)',
      'Booker':         'placing reservations…',
      'Trip Briefer':   'composing summary email',
    };
    return opts[a.name] || 'thinking…';
  }
  function randomCompletionMsg(a) {
    if (!a) return 'done';
    const opts = {
      'Brief Reader': 'extracted: SFO → CDG, 5 nights, 2 travelers, $4.5k',
      'Flight Scout': 'returned 3 flight options · best $682 r/t',
      'Hotel Curator': 'returned 4 hotels · 8.7★ avg',
      'Itinerary Planner': 'plan ready: 5 days, 11 stops, 3 reservations',
      'Human Approval': 'approved by m.chen@acme.co',
      'Booker':         '3 confirmations issued · #FX2240, #BK9912, #RS4421',
      'Trip Briefer':   'summary sent to traveler',
    };
    return opts[a.name] || 'returned';
  }

  const updateAgent = useCallback((id, patch) => {
    setAgents((A) => A.map(a => a.id === id ? { ...a, ...patch } : a));
    setDirty(true);
  }, []);
  const deleteAgent = useCallback((id) => {
    setAgents((A) => A.filter(a => a.id !== id));
    setConnections((C) => C.filter(c => c.fromId !== id && c.toId !== id));
    setSelectedId(null);
    setDirty(true);
  }, []);
  const addAgent = useCallback((tpl, x, y) => {
    const a = makeAgent(tpl, x, y);
    setAgents((A) => [...A, a]);
    setSelectedId(a.id);
    setDirty(true);
  }, []);
  const addConnection = useCallback((fromId, toId) => {
    if (fromId === toId) return;
    setConnections((C) => {
      if (C.some(c => c.fromId === fromId && c.toId === toId)) return C;
      return [...C, { id: 'c-' + Math.random().toString(36).slice(2, 7), fromId, toId, label: '' }];
    });
    setDirty(true);
  }, []);

  const onStartDrag = (e, tpl) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-agent', JSON.stringify(tpl));
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = `<div class="av" style="background:#222"></div>
      <div><div class="nm">${tpl.name}</div><div class="rl">${tpl.role}</div></div>`;
    ghost.style.position = 'absolute';
    ghost.style.top = '-9999px';
    document.body.appendChild(ghost);
    try { e.dataTransfer.setDragImage(ghost, 110, 22); } catch (_) {}
    setTimeout(() => ghost.remove(), 0);
  };

  const spawnAt = (tpl) => {
    addAgent(tpl, 200 + Math.random() * 200, 400 + Math.random() * 80);
  };

  const selectedAgent = agents.find(a => a.id === selectedId) || null;

  return (
    <div className="app">
      <TopBar
        theme={t.theme}
        onTheme={(v) => setTweak('theme', v)}
        running={running}
        onRun={startRun}
        onStop={stopRun}
        agentCount={agents.length}
        connCount={connections.length}
        runStep={runStep}
        runOrder={runOrder}
        runElapsed={runElapsed}
        dirty={dirty}
      />

      <Library
        query={query} onQuery={setQuery}
        tab={tab} onTab={setTab}
        onStartDrag={onStartDrag}
        onSpawnAt={spawnAt}
      />

      <Canvas
        agents={agents}
        connections={connections}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onUpdateAgent={updateAgent}
        onAddConnection={addConnection}
        onAddAgentAt={addAgent}
        density={t.density}
        connStyle={t.connStyle}
        bgPattern={t.bgPattern}
        running={running}
        runStep={runStep}
        runProgress={runProgress}
        runDoneIds={runDoneIds}
      />

      <Inspector
        agent={selectedAgent}
        onChange={(patch) => updateAgent(selectedAgent.id, patch)}
        onDelete={() => deleteAgent(selectedAgent.id)}
        onChangeAvatarSeed={(seed) => updateAgent(selectedAgent.id, { avatarSeed: seed })}
        connectionsCount={selectedAgent ? connections.filter(c => c.fromId === selectedAgent.id || c.toId === selectedAgent.id).length : 0}
      />

      <RunOverlay
        running={running}
        agents={agents}
        runOrder={runOrder}
        runStep={runStep}
        runElapsed={runElapsed}
        log={log}
      />

      <TweaksPanel>
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme}
                    options={['dark','light']}
                    onChange={(v) => setTweak('theme', v)} />
        <TweakSelect label="Accent" value={t.accentHue}
                    options={[
                      { value: 262, label: 'Iris (default)' },
                      { value: 220, label: 'Cobalt' },
                      { value: 158, label: 'Mint' },
                      { value: 28,  label: 'Amber' },
                      { value: 350, label: 'Magenta' },
                      { value: 200, label: 'Cyan' },
                    ]}
                    onChange={(v) => setTweak('accentHue', v)} />
        <TweakRadio label="Density" value={t.density}
                    options={['compact','regular']}
                    onChange={(v) => setTweak('density', v)} />

        <TweakSection label="Canvas" />
        <TweakRadio label="Background" value={t.bgPattern}
                    options={['dots','grid','blank']}
                    onChange={(v) => setTweak('bgPattern', v)} />
        <TweakRadio label="Connections" value={t.connStyle}
                    options={['curved','stepped','straight']}
                    onChange={(v) => setTweak('connStyle', v)} />

        <TweakSection label="Run" />
        <TweakButton label={running ? 'Stop demo run' : 'Run demo workflow'} onClick={() => running ? stopRun() : startRun()} />
        <TweakButton label="Reset workflow" secondary onClick={() => {
          const s = buildSeed();
          setAgents(s.agents); setConnections(s.connections);
          setSelectedId('a-004'); setRunDoneIds([]); setRunStep(0); setLog([]);
          setDirty(false);
        }} />
      </TweaksPanel>
    </div>
  );
}
