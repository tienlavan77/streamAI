// background.js — service worker (MV3)
// Trách nhiệm: nhận kết quả đã parse sẵn (rawText + codeBlocks) từ bridge.js, gửi lên server local.

const SERVER_URL = 'http://192.168.1.181:3001/api/save-conversation';

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'conversation-captured') {
    console.log('Received captured conversation:', message.payload);
    sendToServer(message.payload);
  }
  // return false / không trả gì — đây là fire-and-forget, không cần response về content script
});

async function sendToServer(payload, attempt = 1) {
  try {
    const codeBlock = payload.codeBlocks?.[0];
    const normalizedPayload = {
      ...payload,
      path: payload.path ?? codeBlock?.path ?? '',
      code: payload.code ?? codeBlock?.code ?? '',
    };
    console.log(`[AI-Capturer] Gửi server (lần ${attempt}):`, normalizedPayload);
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload),
    });

    if (!response.ok) {
      throw new Error(`Server trả về status ${response.status}`);
    }

    const result = await response.json();
    console.log('[AI-Capturer] Đã lưu lên server:', result.record?.requestId, `${payload.codeBlocks.length} code block(s)`);
  } catch (err) {
    console.warn(`[AI-Capturer] Gửi server thất bại (lần ${attempt}):`, err.message);

    // Retry đơn giản 1 lần sau 2s — phòng trường hợp server vừa khởi động chưa kịp sẵn sàng
    if (attempt < 2) {
      setTimeout(() => sendToServer(payload, attempt + 1), 2000);
    } else {
      console.error('[AI-Capturer] Bỏ cuộc gửi server sau', attempt, 'lần thử. Kiểm tra server có đang chạy ở', SERVER_URL, 'không.');
    }
  }
}
