# StreamAI - Capturer AI Response

Tiện ích Chrome Manifest V3 dùng để bắt và hiển thị nội dung trả lời dạng streaming từ ChatGPT và Claude, sau đó gửi toàn bộ nội dung đã ghép tới một ứng dụng native qua Native Messaging.

## Tính năng

- Theo dõi các request streaming trên `chatgpt.com` và `claude.ai`.
- Trích xuất text delta theo định dạng riêng của từng dịch vụ.
- Hiển thị câu trả lời trong panel nổi có thể kéo, thu gọn, xóa và sao chép.
- Ghép các chunk theo từng request trong background service worker.
- Gửi nội dung hoàn chỉnh tới native host `com.tinsinhphat.chatblock_extractor`.

## Cấu trúc

| File | Vai trò |
| --- | --- |
| `manifest.json` | Khai báo extension, quyền và content scripts. |
| `interceptor.js` | Chạy trong MAIN world, bọc `window.fetch` và đọc SSE stream. |
| `bridge.js` | Chuyển sự kiện từ trang sang extension, đồng thời tách delta ChatGPT/Claude. |
| `background.js` | Gom chunk và gọi Chrome Native Messaging khi stream kết thúc. |
| `ui-panel.js` | Tạo panel hiển thị câu trả lời trên trang web. |

## Cài đặt extension

1. Mở `chrome://extensions` (hoặc `edge://extensions`).
2. Bật **Developer mode**.
3. Chọn **Load unpacked** và chọn thư mục chứa repository này.
4. Mở hoặc tải lại một cuộc trò chuyện trên `chatgpt.com` hay `claude.ai`.

Extension hiện đăng ký các URL:

- ChatGPT: `/backend-api/f/conversation`
- Claude: `/api/organizations/{org_id}/chat_conversations/{id}/completion`

## Native Messaging (tùy chọn)

Để lưu dữ liệu sang ứng dụng native, cần cài native host có tên:

```text
com.tinsinhphat.chatblock_extractor
```

Native host phải được đăng ký theo cơ chế [Chrome Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging), cho phép extension này (sau khi biết extension ID) và xử lý message dạng:

```json
{
  "action": "save",
  "content": "Nội dung câu trả lời đã ghép"
}
```

Nếu native host chưa được cài, extension vẫn hiển thị và copy được nội dung; lỗi kết nối sẽ xuất hiện trong console của service worker.

## Luồng hoạt động

```text
window.fetch
  -> interceptor.js đọc SSE
  -> window.postMessage
  -> bridge.js trích xuất delta
  -> ui-panel.js hiển thị + background.js gom nội dung
  -> Native Messaging khi stream-done
```

## Phát triển và kiểm tra

Đây là extension JavaScript thuần, không cần bước build hay dependency cài thêm. Sau khi sửa code:

1. Vào `chrome://extensions`.
2. Bấm **Reload** trên extension.
3. Tải lại tab ChatGPT/Claude để content scripts chạy lại.
4. Kiểm tra lỗi tại DevTools của trang và mục **Service worker** của extension.

## Lưu ý

- Thay đổi endpoint hoặc định dạng SSE của ChatGPT/Claude có thể làm việc trích xuất ngừng hoạt động.
- `window.fetch` bị bọc ở MAIN world; các thư viện hoặc extension khác cũng sửa `fetch` có thể ảnh hưởng thứ tự hoạt động.
- Dữ liệu được gửi tới native host dưới dạng văn bản đầy đủ, vì vậy chỉ cài native host mà bạn tin cậy.
- Extension chỉ áp dụng cho đúng hai hostname được khai báo trong `manifest.json`.

## Giấy phép

Chưa khai báo giấy phép. Hãy bổ sung giấy phép trước khi phân phối công khai.
