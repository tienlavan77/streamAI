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

function saveViaNativeMessaging(text) {
  chrome.runtime.sendNativeMessage(
    'com.tinsinhphat.chatblock_extractor',
    { action: 'save', content: text },
    () => {
      if (chrome.runtime.lastError) {
        console.error('Native messaging lỗi:', chrome.runtime.lastError);
      }
    }
  );
}
