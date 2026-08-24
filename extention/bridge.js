// bridge.js — chạy trong isolated world (mặc định), cầu nối giữa interceptor.js (MAIN world)
// và background.js (nơi có quyền chrome.runtime để gửi dữ liệu lên server).
// Trách nhiệm: parse nghiệp vụ (JSON Patch state machine cho ChatGPT, content_block_delta cho Claude),
// tích lũy full text, tách code block kèm vị trí, cập nhật UI, và forward kết quả cuối cùng về background.

// ================== Context validity check ==================
function isExtensionContextValid() {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

let contextDead = false;

function safeSendMessage(message) {
  if (contextDead) return;

  if (!isExtensionContextValid()) {
    contextDead = true;
    console.warn('[AI-Capturer] Extension context đã mất, vui lòng reload trang.');
    return;
  }

  try {
    chrome.runtime.sendMessage(message).catch(() => {
      // background không phản hồi hoặc context vừa chết giữa chừng — bỏ qua an toàn
    });
  } catch (err) {
    contextDead = true;
    console.warn('[AI-Capturer] sendMessage lỗi:', err.message);
  }
}

// ================== Chờ UI panel sẵn sàng ==================
let uiReady = typeof window.AICapturerUI !== 'undefined';
const pendingEvents = [];

if (!uiReady) {
  window.addEventListener('ai-capturer-ui-ready', () => {
    uiReady = true;
    pendingEvents.forEach(handleMessage);
    pendingEvents.length = 0;
  }, { once: true });
}

// ================== State theo từng request ==================
const requestUrls = new Map();       // requestId -> { url, site }
const patchState = new Map();        // requestId -> { lastPath, lastOp } — chỉ dùng cho ChatGPT
const fullTextBuffers = new Map();   // requestId -> accumulated raw text (markdown thuần)

// ================== Parser: ChatGPT — JSON Patch state machine ==================
// Format thật của ChatGPT: mỗi event "delta" có thể khai báo {p, o, v} (path, operation, value)
// hoặc chỉ {v} khi kế thừa path/operation từ chunk trước đó (tối ưu băng thông).
function extractChatGPTDelta(eventType, chunk, requestId) {
  if (eventType !== 'delta' || !chunk) return '';

  if (!patchState.has(requestId)) {
    patchState.set(requestId, { lastPath: null, lastOp: null });
  }
  const state = patchState.get(requestId);

  // Trường hợp patch gộp nhiều thao tác cùng lúc: {"o":"patch","v":[{...},{...}]}
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

// ================== Parser: Claude — content_block_delta chuẩn Anthropic ==================
function extractClaudeDelta(eventType, chunk) {
  if (eventType !== 'content_block_delta') return '';
  if (chunk?.delta?.type === 'text_delta') {
    return chunk.delta.text || '';
  }
  return '';
}

// ================== Tách code block kèm vị trí trong raw text ==================
function extractCodeBlocks(markdownText) {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(markdownText)) !== null) {
    blocks.push({
      language: (match[1] || 'text').toLowerCase(),
      code: match[2].replace(/\n$/, ''),
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return blocks;
}

// ================== Xử lý chính ==================
function handleMessage(event) {
  const { type, payload } = event.data;

  switch (type) {
    case 'stream-start':
      requestUrls.set(payload.requestId, { url: payload.url, site: payload.site });
      patchState.delete(payload.requestId);
      fullTextBuffers.set(payload.requestId, '');
      if (uiReady) window.AICapturerUI.startStream(payload.requestId);
      break;

    case 'stream-chunk': {
      const meta = requestUrls.get(payload.requestId);
      const site = meta?.site || payload.site;
      let text = '';

      if (site === 'chatgpt') {
        text = extractChatGPTDelta(payload.eventType, payload.chunk, payload.requestId);
      } else if (site === 'claude') {
        text = extractClaudeDelta(payload.eventType, payload.chunk);
      }

      if (text) {
        const prev = fullTextBuffers.get(payload.requestId) || '';
        fullTextBuffers.set(payload.requestId, prev + text);
        if (uiReady) window.AICapturerUI.appendChunk(payload.requestId, text);
      }
      break;
    }

    case 'stream-done': {
      patchState.delete(payload.requestId);

      const meta = requestUrls.get(payload.requestId);
      const rawText = fullTextBuffers.get(payload.requestId) || '';
      const codeBlocks = extractCodeBlocks(rawText);

      if (uiReady) window.AICapturerUI.endStream(payload.requestId, { codeBlockCount: codeBlocks.length });

      // Chỉ gửi lên server khi thực sự có nội dung — tránh spam các request phụ/lỗi rỗng
      if (rawText.trim()) {
        safeSendMessage({
          type: 'conversation-captured',
          payload: {
            requestId: payload.requestId,
            source: meta?.site || 'unknown',
            url: meta?.url || '',
            rawText,
            codeBlocks,
            capturedAt: Date.now(),
          },
        });
      }

      requestUrls.delete(payload.requestId);
      fullTextBuffers.delete(payload.requestId);
      break;
    }

    case 'stream-error':
      patchState.delete(payload.requestId);
      requestUrls.delete(payload.requestId);
      fullTextBuffers.delete(payload.requestId);
      console.warn('[AI-Capturer] Stream error:', payload.error);
      break;
  }
}

// ================== Nhận message từ interceptor.js ==================
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== 'ai-capturer') return;

  if (uiReady) {
    handleMessage(event);
  } else {
    pendingEvents.push(event);
  }
});
