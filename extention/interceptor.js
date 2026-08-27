// interceptor.js — chạy trong MAIN world (world của chính trang, không phải isolated world của extension)
// Trách nhiệm: patch fetch, nhận diện đúng request streaming, parse cú pháp SSE thô (event:/data:),
// và forward từng chunk đã parse ra ngoài qua window.postMessage cho bridge.js xử lý nghiệp vụ.

(function () {
  const SITE = location.hostname.includes('chatgpt.com') ? 'chatgpt' : 'claude';

  function isTargetUrl(url) {
    try {
      const { pathname } = new URL(url, location.origin);

      if (SITE === 'chatgpt') {
        // Chỉ khớp đúng endpoint chính, loại /prepare, /textdocs, /stream_status...
        return pathname === '/backend-api/f/conversation';
      }

      // Claude: endpoint completion thật của claude.ai
      return /\/api\/organizations\/[^/]+\/chat_conversations\/[^/]+\/completion/.test(pathname);
    } catch {
      return false;
    }
  }

  function emit(type, payload) {
    window.postMessage({ source: 'ai-capturer', type, payload: { ...payload, site: SITE } }, '*');
  }

  // ---------- Patch fetch ----------
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const request = args[0];
    const url = typeof request === 'string' ? request : request?.url;

    const response = await originalFetch.apply(this, args);

    if (url && isTargetUrl(url) && response.body) {
      const requestId = crypto.randomUUID();
      emit('stream-start', { requestId, url });

      // Clone để không phá luồng gốc mà trang đang dùng để render UI
      const cloned = response.clone();
      readSSEStream(cloned.body, requestId);
    }

    return response;
  };

  async function readSSEStream(body, requestId) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = 'message'; // mặc định theo chuẩn SSE khi không có dòng "event:"

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // giữ lại dòng chưa hoàn chỉnh cho lần đọc sau

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          if (line.trim() === '') {
            currentEvent = 'message'; // dòng trống = ranh giới message SSE, reset về mặc định
            continue;
          }

          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();

          if (raw === '[DONE]') {
            emit('stream-done', { requestId });
            continue;
          }

          try {
            const json = JSON.parse(raw);
            emit('stream-chunk', { requestId, eventType: currentEvent, chunk: json });
          } catch {
            // dòng không parse được JSON hợp lệ (hiếm, thường do buffer cắt giữa chừng) — bỏ qua an toàn
          }
        }
      }

      // Claude không phải lúc nào cũng gửi "[DONE]" tường minh — đảm bảo luôn báo kết thúc khi stream đóng
      emit('stream-done', { requestId });
    } catch (err) {
      emit('stream-error', { requestId, error: String(err) });
    }
  }

  // ---------- Patch XMLHttpRequest (phòng trường hợp site chuyển sang dùng XHR streaming) ----------
  const OriginalXHR = window.XMLHttpRequest;

  function PatchedXHR() {
    const xhr = new OriginalXHR();
    let url = '';
    let requestId = null;
    let lastLength = 0;
    let currentEvent = 'message';

    const originalOpen = xhr.open;
    xhr.open = function (method, requestUrl, ...rest) {
      url = requestUrl;
      return originalOpen.call(xhr, method, requestUrl, ...rest);
    };

    xhr.addEventListener('readystatechange', function () {
      if (!isTargetUrl(url)) return;

      if (xhr.readyState === 3 || xhr.readyState === 4) {
        if (!requestId) {
          requestId = crypto.randomUUID();
          emit('stream-start', { requestId, url });
        }

        const newText = xhr.responseText.slice(lastLength);
        lastLength = xhr.responseText.length;

        if (newText) {
          const lines = newText.split('\n');
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
              continue;
            }
            if (line.trim() === '') {
              currentEvent = 'message';
              continue;
            }
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') {
                emit('stream-done', { requestId });
              } else {
                try {
                  emit('stream-chunk', { requestId, eventType: currentEvent, chunk: JSON.parse(raw) });
                } catch {}
              }
            }
          }
        }

        if (xhr.readyState === 4) {
          emit('stream-done', { requestId });
        }
      }
    });

    return xhr;
  }

  window.XMLHttpRequest = PatchedXHR;

  console.log(`[AI-Capturer] interceptor.js loaded (site: ${SITE})`);
})();
