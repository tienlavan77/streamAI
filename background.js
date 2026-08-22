// background.js

const activeStreams = new Map(); // requestId -> { url, text }

chrome.runtime.onMessage.addListener((message) => {
  const { type, payload } = message;

  switch (type) {
    case 'stream-start':
      activeStreams.set(payload.requestId, { url: payload.url, text: '' });
      break;

    case 'stream-chunk': {
      const stream = activeStreams.get(payload.requestId);
      if (stream && typeof payload.text === 'string') {
        stream.text += payload.text;
      }
      break;
    }

    case 'stream-done': {
      const stream = activeStreams.get(payload.requestId);
      if (stream) {
        saveViaNativeMessaging(stream.text);
        activeStreams.delete(payload.requestId);
      }
      break;
    }

    case 'stream-error':
      activeStreams.delete(payload.requestId);
      break;
  }
});

// Phân tích Markdown fenced code block và lấy ngôn ngữ khai báo sau dấu ```/~~~.
function analyzeMessage(message) {
  const text = typeof message === 'string' ? message : '';
  const codeBlocks = [];
  const fencePattern = /(^|\n)[ \t]*(```|~~~)[ \t]*([^\n]*)\n([\s\S]*?)(?:\n|^)\s*\2[ \t]*(?=\n|$)/g;
  let match;

  while ((match = fencePattern.exec(text)) !== null) {
    const info = match[3].trim();
    // Chỉ lấy token đầu tiên, ví dụ "javascript {title=app}" -> "javascript".
    const language = info.split(/[\s{]/, 1)[0] || null;
    codeBlocks.push({
      language,
      code: match[4].replace(/\n$/, ''),
    });
  }

  return { text, codeBlocks };
}

function saveViaNativeMessaging(text) {
  chrome.runtime.sendNativeMessage(
    'com.tinsinhphat.chatblock_extractor',
    {
      action: 'save',
      content: text,
      analysis: analyzeMessage(text),
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error('Native messaging lỗi:', chrome.runtime.lastError);
      }
    }
  );
}
