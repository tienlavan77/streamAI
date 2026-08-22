// bridge.js — isolated world
// Hoạt động trên cả chatgpt.com và claude.ai

function isExtensionContextValid() {
  try { return !!chrome.runtime?.id; } catch { return false; }
}

let contextDead = false;

function safeSendMessage(message) {
  if (contextDead) return;
  if (!isExtensionContextValid()) { contextDead = true; return; }
  try {
    chrome.runtime.sendMessage(message).catch(() => {});
  } catch {
    contextDead = true;
  }
}

let uiReady = typeof window.AICapturerUI !== 'undefined';
const pendingEvents = [];

if (!uiReady) {
  window.addEventListener('ai-capturer-ui-ready', () => {
    uiReady = true;
    pendingEvents.forEach(handleMessage);
    pendingEvents.length = 0;
  }, { once: true });
}

const host = location.hostname;
const isChatGPT = host === 'chatgpt.com';
const isClaude = host === 'claude.ai';

// ==== ChatGPT: patch-style streaming ====
const patchState = new Map(); // requestId -> { lastPath, lastOp }

function extractChatGPTDelta(eventType, chunk, requestId) {
  if (eventType !== 'delta' || !chunk) return '';

  if (!patchState.has(requestId)) {
    patchState.set(requestId, { lastPath: null, lastOp: null });
  }
  const state = patchState.get(requestId);

  // Trường hợp patch gộp nhiều thao tác: {"o":"patch","v":[{...},{...}]}
  if (chunk.o === 'patch' && Array.isArray(chunk.v)) {
    let text = '';
    for (const op of chunk.v) {
      if (op.p === '/message/content/parts/0' && op.o === 'append' && typeof op.v === 'string') {
        text += op.v;
      }
    }
    return text;
  }

  if (chunk.p !== undefined) state.lastPath = chunk.p;
  if (chunk.o !== undefined) state.lastOp = chunk.o;

  const isContentAppend =
    state.lastOp === 'append' &&
    state.lastPath === '/message/content/parts/0';

  if (isContentAppend && typeof chunk.v === 'string') {
    return chunk.v;
  }

  return '';
}

// ==== Claude: chuẩn Anthropic streaming events ====
// event: content_block_delta
// data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"..."}}
function extractClaudeDelta(eventType, chunk) {
  if (eventType !== 'content_block_delta') return '';
  if (chunk?.delta?.type === 'text_delta') {
    return chunk.delta.text || '';
  }
  return '';
}

function extractDelta(eventType, chunk, requestId) {
  if (isChatGPT) return extractChatGPTDelta(eventType, chunk, requestId);
  if (isClaude) return extractClaudeDelta(eventType, chunk);
  return '';
}

function handleMessage(event) {
  const { type, payload } = event.data;

  switch (type) {
    case 'stream-start':
      patchState.delete(payload.requestId);
      if (uiReady) window.AICapturerUI.startStream(payload.requestId);
      break;

    case 'stream-chunk': {
      const text = extractDelta(payload.eventType, payload.chunk, payload.requestId);
      if (text && uiReady) {
        window.AICapturerUI.appendChunk(payload.requestId, text);
      }
      // Gửi kèm text đã trích xuất để background.js gộp lại không cần biết
      // định dạng riêng của từng site.
      safeSendMessage({ type, payload: { ...payload, text } });
      return;
    }

    case 'stream-done':
      patchState.delete(payload.requestId);
      if (uiReady) window.AICapturerUI.endStream(payload.requestId);
      break;

    case 'stream-error':
      patchState.delete(payload.requestId);
      console.warn('[AI-Capturer] Stream error:', payload.error);
      break;
  }

  safeSendMessage({ type, payload });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== 'ai-capturer') return;

  if (uiReady) {
    handleMessage(event);
  } else {
    pendingEvents.push(event);
  }
});
