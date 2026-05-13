import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import TopBar from './components/TopBar';
import Landing from './components/Landing';
import AuthPage from './components/AuthPage';
import ApiKeySetup from './components/ApiKeySetup';
import Library from './components/Library';
import Canvas from './components/Canvas';
import Inspector from './components/Inspector';
import RunOverlay from './components/RunOverlay';
import { TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakButton, useTweaks } from './components/TweaksPanel';
import { AGENT_TEMPLATES } from './data/templates';
import { api } from './api';

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
function shortId(id) {
  const s = String(id);
  if (s.startsWith('a-')) return '#' + s.slice(2).toUpperCase();
  return s.slice(0, 7).toUpperCase();
}

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

function isBackendId(id) {
  return String(id).includes('-');
}

function buildSeed() {
  const T = (id) => AGENT_TEMPLATES.find(t => t.id === id);
  const a1 = makeAgent(T('tpl-code-gen'),    60,   20,  'a-001');
  a1.name = 'Feature Spec'; a1.role = 'Parses requirements';
  a1.prompt = 'Parse the feature request and extract: endpoints, data models, business logic, error scenarios. Output a structured spec.';
  a1.skills = ['Analyze','Plan'];
  a1.avatarSeed = 'spec-001';

  const a2 = makeAgent(T('tpl-code-gen'),    360,  20,  'a-002');
  a2.name = 'Code Generator';
  a2.avatarSeed = 'codegen-002';

  const a3 = makeAgent(T('tpl-code-review'), 700,  20,  'a-003');
  a3.name = 'Code Reviewer';
  a3.avatarSeed = 'review-003';

  const a4 = makeAgent(T('tpl-test-design'), 360,  260, 'a-004');
  a4.name = 'Test Case Designer';
  a4.avatarSeed = 'testcase-004';

  const a5 = makeAgent(T('tpl-unit-test'),   700,  260, 'a-005');
  a5.name = 'Unit Test Runner';
  a5.avatarSeed = 'unittest-005';

  const a6 = makeAgent(T('tpl-deploy'),      1040, 140, 'a-006');
  a6.name = 'Deployment Coordinator';
  a6.avatarSeed = 'deploy-006';

  const a7 = makeAgent(T('tpl-docs-writer'), 1340, 140, 'a-007');
  a7.name = 'Doc Writer';
  a7.avatarSeed = 'docs-007';

  const cs = [
    { id: 'c1', fromId: 'a-001', toId: 'a-002', label: 'spec' },
    { id: 'c2', fromId: 'a-002', toId: 'a-003', label: 'code' },
    { id: 'c3', fromId: 'a-002', toId: 'a-004', label: 'code' },
    { id: 'c4', fromId: 'a-003', toId: 'a-006', label: 'approved' },
    { id: 'c5', fromId: 'a-004', toId: 'a-005', label: 'test cases' },
    { id: 'c6', fromId: 'a-005', toId: 'a-006', label: 'tests passed' },
    { id: 'c7', fromId: 'a-006', toId: 'a-007', label: 'deployed' },
  ];

  _agentCounter = 8;
  return { agents: [a1, a2, a3, a4, a5, a6, a7], connections: cs };
}

function mapBackendAgent(a) {
  return {
    id: a.id,
    shortId: shortId(a.id),
    templateId: a.template_id || '',
    avatarSeed: a.avatar_seed || '',
    name: a.name,
    role: a.role || '',
    model: a.model,
    skills: a.skills || [],
    prompt: a.system_prompt || '',
    temperature: a.temperature,
    maxTokens: a.max_tokens,
    retries: a.retries,
    outputSchema: a.output_schema || 'freeform',
    x: a.position_x,
    y: a.position_y,
  };
}

function mapBackendConnection(c) {
  return {
    id: c.id,
    fromId: c.from_agent_id,
    toId: c.to_agent_id,
    label: c.label || '',
  };
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => { document.documentElement.setAttribute('data-theme', t.theme); }, [t.theme]);
  useEffect(() => { document.documentElement.style.setProperty('--accent-h', t.accentHue); }, [t.accentHue]);

  const [page, setPage] = useState('landing');
  const [user, setUser] = useState(null);
  const [apiKeys, setApiKeys] = useState(() => {
    try { return JSON.parse(localStorage.getItem('andromeda_api_keys') || 'null'); }
    catch { return null; }
  });
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled');
  const [workflowList, setWorkflowList] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const seed = useMemo(buildSeed, []);
  const [agents, setAgents] = useState(seed.agents);
  const [connections, setConnections] = useState(seed.connections);
  const [selectedId, setSelectedId] = useState('a-003');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [dirty, setDirty] = useState(false);

  const initWorkflow = useCallback(async () => {
    setWorkflowLoading(true);
    try {
      const list = await api.listWorkflows();
      setWorkflowList(list);
      if (list.length > 0) {
        await loadWorkflow(list[0].id);
      } else {
        setAgents([]);
        setConnections([]);
        setWorkflowId(null);
        setWorkflowName('Untitled');
        setDirty(false);
      }
    } catch {
      const s = buildSeed();
      setAgents(s.agents);
      setConnections(s.connections);
    }
    setWorkflowLoading(false);
  }, []);

  const loadWorkflow = useCallback(async (id) => {
    setWorkflowLoading(true);
    const wf = await api.getWorkflow(id);
    setWorkflowId(wf.id);
    setWorkflowName(wf.name || 'Untitled');
    setAgents(wf.agents.map(mapBackendAgent));
    setConnections(wf.connections.map(mapBackendConnection));
    setSelectedId(null);
    setDirty(false);
    setWorkflowLoading(false);
  }, []);

  const saveWorkflow = useCallback(async () => {
    setSaving(true);
    try {
      let wfId = workflowId;
      if (!wfId) {
        const wf = await api.createWorkflow({ name: workflowName, description: '' });
        wfId = wf.id;
        setWorkflowId(wfId);
      } else {
        await api.updateWorkflow(wfId, { name: workflowName });
      }

      for (const a of agents) {
        const payload = {
          template_id: a.templateId || '',
          name: a.name,
          role: a.role || '',
          model: a.model,
          system_prompt: a.prompt || '',
          temperature: a.temperature,
          max_tokens: a.maxTokens,
          retries: a.retries,
          output_schema: a.outputSchema || 'freeform',
          skills: a.skills || [],
          position_x: a.x,
          position_y: a.y,
          avatar_seed: a.avatarSeed || '',
        };
        if (isBackendId(a.id)) {
          await api.updateAgent(wfId, a.id, payload);
        } else {
          const created = await api.addAgent(wfId, payload);
          a.id = created.id;
          a.shortId = shortId(created.id);
        }
      }

      for (const c of connections) {
        const payload = {
          from_agent_id: c.fromId,
          to_agent_id: c.toId,
          label: c.label || '',
        };
        if (!isBackendId(c.id)) {
          await api.addConnection(wfId, payload);
        }
      }

      setDirty(false);
      const list = await api.listWorkflows();
      setWorkflowList(list);
    } catch (e) {
      console.error('Save failed', e);
    }
    setSaving(false);
  }, [workflowId, workflowName, agents, connections]);

  const newWorkflow = useCallback(async () => {
    setAgents([]);
    setConnections([]);
    setWorkflowId(null);
    setWorkflowName('Untitled');
    setSelectedId(null);
    setRunDoneIds([]);
    setRunStep(0);
    setLog([]);
    setDirty(true);
  }, []);

  const deleteWorkflow = useCallback(async (id) => {
    await api.deleteWorkflow(id);
    const list = await api.listWorkflows();
    setWorkflowList(list);
    if (id === workflowId) {
      if (list.length > 0) {
        await loadWorkflow(list[0].id);
      } else {
        newWorkflow();
      }
    }
  }, [workflowId, loadWorkflow, newWorkflow]);

  const switchWorkflow = useCallback(async (id) => {
    if (id === workflowId) return;
    await loadWorkflow(id);
  }, [workflowId, loadWorkflow]);

  useEffect(() => { initWorkflow(); }, [initWorkflow]);

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
      'Feature Spec':         'parsing PRD and extracting requirements…',
      'Code Generator':       'generating production code from spec…',
      'Code Reviewer':        'running static analysis and security scan…',
      'Test Case Designer':   'designing test matrix with edge cases…',
      'Unit Test Runner':     'executing test suite across 3 runtimes…',
      'Deployment Coordinator':'running canary rollout to staging…',
      'Doc Writer':           'generating API docs and changelog…',
    };
    return opts[a.name] || 'thinking…';
  }
  function randomCompletionMsg(a) {
    if (!a) return 'done';
    const opts = {
      'Feature Spec':         'spec complete: 4 endpoints, 12 models, 8 rules',
      'Code Generator':       'generated 3 services · 1,420 LOC · 0 lint errors',
      'Code Reviewer':        '2 warnings · 1 info · 0 critical · score 9.2/10',
      'Test Case Designer':   '48 test cases · 92% coverage · 12 edge cases',
      'Unit Test Runner':     '142/142 passed · 87% coverage · 1.2s runtime',
      'Deployment Coordinator':'v2.4.1 live on staging · health OK · 12s rollout',
      'Doc Writer':           'README + API ref + changelog written to /docs',
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

  if (page === 'landing') {
    return <Landing onEnter={() => setPage('auth')} />;
  }

  if (page === 'auth') {
    return (
      <AuthPage
        onAuth={(d) => { setUser(d); setPage(apiKeys ? 'studio' : 'apikeys'); }}
        onBack={() => setPage('landing')}
      />
    );
  }

  if (page === 'apikeys') {
    return (
      <ApiKeySetup
        onComplete={(keys) => { setApiKeys(keys); setPage('studio'); }}
        onSkip={() => setPage('studio')}
      />
    );
  }

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
        saving={saving}
        workflowId={workflowId}
        workflowName={workflowName}
        workflowList={workflowList}
        workflowLoading={workflowLoading}
        onSave={saveWorkflow}
        onNew={newWorkflow}
        onDelete={deleteWorkflow}
        onSwitch={switchWorkflow}
        onRename={(n) => { setWorkflowName(n); setDirty(true); }}
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
        <TweakButton label={running ? 'Stop run' : 'Run workflow'} onClick={() => running ? stopRun() : startRun()} />
        <TweakButton label="Reset to demo" secondary onClick={() => {
          const s = buildSeed();
          setAgents(s.agents); setConnections(s.connections);
          setSelectedId('a-003'); setRunDoneIds([]); setRunStep(0); setLog([]);
          setDirty(true);
        }} />
      </TweaksPanel>
    </div>
  );
}
