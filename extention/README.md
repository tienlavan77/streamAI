# AI Response Capturer

Bắt luồng streaming từ ChatGPT và Claude.ai, tách code block ngay tại trình duyệt, gửi về server local để lưu trữ.

## Cấu trúc

```
ai-capturer/
├── extension/          ← Chrome extension (Manifest V3)
│   ├── manifest.json
│   ├── interceptor.js  ← MAIN world: patch fetch, parse SSE thô
│   ├── bridge.js        ← isolated world: parse nghiệp vụ, tách code block
│   ├── ui-panel.js      ← panel nổi hiển thị realtime
│   └── background.js    ← service worker: gửi kết quả lên server
└── server/              ← Node.js/Express server
    ├── server.js
    ├── package.json
    └── output/           ← code block được lưu ra file thật (tự tạo khi chạy)
    └── conversations.json ← index toàn bộ conversation (tự tạo khi chạy)
```

## Cài đặt

### 1. Server

```bash
cd server
npm install
npm start
```

Server chạy tại `http://localhost:3000`. Giữ terminal này mở khi dùng extension.

### 2. Extension

1. Mở Chrome → `chrome://extensions`
2. Bật **Developer mode** (góc trên phải)
3. Bấm **Load unpacked** → chọn thư mục `extension/`
4. Mở tab mới tới `chatgpt.com` hoặc `claude.ai`, gửi thử 1 tin nhắn

Panel nhỏ sẽ hiện góc phải màn hình, cập nhật nội dung theo thời gian thực. Khi AI trả lời xong, nếu có code block, dữ liệu tự động gửi về server.

## Kiểm tra dữ liệu đã lưu

```bash
# Toàn bộ conversation đã lưu
curl http://localhost:3000/api/conversations

# 1 conversation cụ thể theo requestId
curl http://localhost:3000/api/conversations/<requestId>
```

Code block lưu thành file thật trong `server/output/`, đặt tên theo mẫu:
`<source>_<requestId>_<index>.<ext>` (ví dụ `chatgpt_bc1d34a0_0.js`).

Mỗi bản ghi trong `conversations.json` gồm:
- `rawText` — toàn bộ đoạn chat gốc, không cắt xén
- `codeBlocks[]` — mỗi block có `language`, `startIndex`/`endIndex` (vị trí trong `rawText`,
  dùng để highlight lại), `fileName`, `filePath`, `sizeBytes`

## Ghi chú quan trọng

- **Endpoint nội bộ, không có docs chính thức.** `interceptor.js` bắt đúng
  `https://chatgpt.com/backend-api/f/conversation` và endpoint `completion` của
  `claude.ai` — cả hai đều có thể đổi bất kỳ lúc nào không báo trước. Nếu panel ngừng
  bắt được nội dung, việc đầu tiên cần kiểm tra là URL thật (Network tab) có còn khớp
  với `isTargetUrl()` trong `interceptor.js` không.
- **Không dùng chung Chrome profile với extension cũ** từng patch `fetch` trên cùng
  domain — 2 extension patch `window.fetch` cùng lúc sẽ đè lẫn nhau (đã từng gặp
  trường hợp này khi phát triển).
- **Quy trình sau mỗi lần sửa code:** reload extension trong `chrome://extensions` →
  đóng hẳn tab ChatGPT/Claude cũ → mở tab mới. Bỏ qua bước đóng tab là nguyên nhân
  phổ biến nhất khiến "sửa code rồi mà vẫn chạy như cũ".
