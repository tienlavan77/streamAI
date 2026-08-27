const BASE = process.env.BACKEND_BASE_URL;

export const BACKEND_ENDPOINTS = {
   chat: `${BASE}/api/conversations/chat`,
   agents: `${BASE}/api/agents`,
   agentById: (id) => `${BASE}/api/agents/${id}`,
   conversations: `${BASE}/api/conversations`,
   browser: {
      open: `${BASE}/browser/open`
   }
};