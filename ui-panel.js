// ui-panel.js — isolated world

const AICapturerUI = (() => {
  let panelEl = null;
  let contentEl = null;
  const streamBuffers = new Map();

  function injectPanel() {
    if (document.getElementById('ai-capturer-panel')) return;

    panelEl = document.createElement('div');
    panelEl.id = 'ai-capturer-panel';
    panelEl.innerHTML = `
      <div id="ai-capturer-header">
        <span>🧩 AI Capturer</span>
        <div>
          <button id="ai-capturer-clear" title="Xóa">🗑</button>
          <button id="ai-capturer-copy" title="Copy">📋</button>
          <button id="ai-capturer-toggle" title="Thu gọn">—</button>
        </div>
      </div>
      <pre id="ai-capturer-content"></pre>
    `;

    document.documentElement.appendChild(panelEl);
    contentEl = panelEl.querySelector('#ai-capturer-content');

    injectStyles();
    bindControls();
    makeDraggable(panelEl, panelEl.querySelector('#ai-capturer-header'));
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #ai-capturer-panel {
        position: fixed; top: 80px; right: 20px; width: 340px; max-height: 420px;
        background: #1e1e1e; color: #e6e6e6; border: 1px solid #3a3a3a;
        border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 2147483647; font-family: -apple-system, "Segoe UI", sans-serif;
        font-size: 12px; display: flex; flex-direction: column; overflow: hidden;
      }
      #ai-capturer-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px 10px; background: #2a2a2a; cursor: move; user-select: none; font-weight: 600;
      }
      #ai-capturer-header button { background: none; border: none; color: #ccc; cursor: pointer; font-size: 13px; margin-left: 6px; }
      #ai-capturer-header button:hover { color: #fff; }
      #ai-capturer-content {
        margin: 0; padding: 10px; overflow-y: auto; white-space: pre-wrap;
        word-break: break-word; flex: 1; line-height: 1.5;
      }
      #ai-capturer-panel.collapsed #ai-capturer-content { display: none; }
      #ai-capturer-panel.collapsed { max-height: 40px; }
    `;
    document.documentElement.appendChild(style);
  }

  function bindControls() {
    panelEl.querySelector('#ai-capturer-clear').onclick = () => {
      streamBuffers.clear();
      contentEl.textContent = '';
    };
    panelEl.querySelector('#ai-capturer-copy').onclick = () => {
      navigator.clipboard.writeText(contentEl.textContent);
    };
    panelEl.querySelector('#ai-capturer-toggle').onclick = () => {
      panelEl.classList.toggle('collapsed');
    };
  }

  function makeDraggable(el, handle) {
    let offsetX = 0, offsetY = 0, dragging = false;
    handle.addEventListener('mousedown', (e) => {
      dragging = true;
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
      el.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => (dragging = false));
  }

  function startStream(requestId) {
    streamBuffers.set(requestId, '');
    render();
  }

  function appendChunk(requestId, text) {
    if (!streamBuffers.has(requestId)) streamBuffers.set(requestId, '');
    streamBuffers.set(requestId, streamBuffers.get(requestId) + text);
    render();
  }

  function endStream() {
    render();
  }

  function render() {
    if (!contentEl) return;
    const all = [...streamBuffers.values()].filter(Boolean).join('\n\n---\n\n');
    contentEl.textContent = all || '(chưa có dữ liệu)';
    contentEl.scrollTop = contentEl.scrollHeight;
  }

  return { injectPanel, startStream, appendChunk, endStream };
})();

// Gán tường minh NGAY LẬP TỨC — không đợi DOMContentLoaded cho phần này
window.AICapturerUI = AICapturerUI;
window.dispatchEvent(new CustomEvent('ai-capturer-ui-ready'));

// Chỉ riêng việc chèn panel vào DOM mới cần đợi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => AICapturerUI.injectPanel());
} else {
  AICapturerUI.injectPanel();
}