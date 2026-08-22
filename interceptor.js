// interceptor.js — MAIN world
// Hoạt động trên cả chatgpt.com và claude.ai

(function () {
  const host = location.hostname;
  const isChatGPT = host === 'chatgpt.com';
  const isClaude = host === 'claude.ai';

  function isTargetUrl(url) {
    try {
      const { pathname } = new URL(url, location.origin);

      if (isChatGPT) {
        return pathname === '/backend-api/f/conversation';
      }

      if (isClaude) {
        // Claude web endpoint thật: /api/organizations/{org_id}/chat_conversations/{id}/completion
        return /\/api\/organizations\/[^/]+\/chat_conversations\/[^/]+\/completion/.test(pathname);
      }

      return false;
    } catch {
      return false;
    }
  }

  function emit(type, payload) {
    window.postMessage({ source: 'ai-capturer', type, payload }, '*');
  }

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const request = args[0];
    const url = typeof request === 'string' ? request : request?.url;

    const response = await originalFetch.apply(this, args);

    if (url && isTargetUrl(url) && response.body) {
      const requestId = crypto.randomUUID();
      emit('stream-start', { requestId, url });

      const cloned = response.clone();
      readSSEStream(cloned.body, requestId);
    }

    return response;
  };

  async function readSSEStream(body, requestId) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = 'message';
    let doneEmitted = false;

    function emitDoneOnce() {
      if (doneEmitted) return;
      doneEmitted = true;
      emit('stream-done', { requestId });
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          if (line.trim() === '') {
            currentEvent = 'message';
            continue;
          }

          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();

          if (raw === '[DONE]') {
            emitDoneOnce();
            continue;
          }

          try {
            const json = JSON.parse(raw);
            emit('stream-chunk', { requestId, eventType: currentEvent, chunk: json });
          } catch {}
        }
      }

      // Claude thường không gửi "[DONE]" tường minh — kết thúc khi stream đóng.
      // ChatGPT gửi "[DONE]" tường minh nên emitDoneOnce() ở trên đã xử lý,
      // cờ doneEmitted đảm bảo không bắn stream-done hai lần.
      emitDoneOnce();
    } catch (err) {
      emit('stream-error', { requestId, error: String(err) });
    }
  }
})();
