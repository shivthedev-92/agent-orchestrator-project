const API_BASE = '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }
  return res.json();
}

export const api = {
  // Workflows
  listWorkflows: () => request('GET', '/workflows'),
  getWorkflow: (id) => request('GET', `/workflows/${id}`),
  createWorkflow: (data) => request('POST', '/workflows', data),
  updateWorkflow: (id, data) => request('PUT', `/workflows/${id}`, data),
  deleteWorkflow: (id) => request('DELETE', `/workflows/${id}`),

  // Agents
  addAgent: (workflowId, data) => request('POST', `/workflows/${workflowId}/agents`, data),
  updateAgent: (workflowId, agentId, data) => request('PUT', `/workflows/${workflowId}/agents/${agentId}`, data),
  deleteAgent: (workflowId, agentId) => request('DELETE', `/workflows/${workflowId}/agents/${agentId}`),

  // Connections
  addConnection: (workflowId, data) => request('POST', `/workflows/${workflowId}/connections`, data),
  deleteConnection: (workflowId, connId) => request('DELETE', `/workflows/${workflowId}/connections/${connId}`),

  // Runs
  startRun: (workflowId) => request('POST', `/workflows/${workflowId}/run`),
  getRuns: (workflowId) => request('GET', `/workflows/${workflowId}/runs`),
  getRun: (runId) => request('GET', `/runs/${runId}`),
};
