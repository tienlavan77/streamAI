// server.js — nhận conversation đã parse sẵn từ extension (rawText + codeBlocks),
// sinh filePath/fileName cho từng code block, lưu file thật ra đĩa,
// và ghi 1 bản ghi tổng hợp (kèm rawText để tham chiếu vị trí) vào index JSON.

const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3001;

const OUTPUT_DIR = path.join(__dirname, 'output');
const DB_FILE = path.join(__dirname, 'conversations.json');

app.use(cors()); // extension gọi từ origin khác (chrome-extension://...), cần bật CORS
app.use(express.json({ limit: '10mb' })); // rawText có thể dài, tăng giới hạn body

const EXT_MAP = {
  javascript: 'js', js: 'js',
  typescript: 'ts', ts: 'ts',
  jsx: 'jsx', tsx: 'tsx',
  python: 'py', py: 'py',
  json: 'json',
  bash: 'sh', shell: 'sh', sh: 'sh',
  html: 'html',
  css: 'css', scss: 'scss',
  java: 'java',
  c: 'c', cpp: 'cpp', 'c++': 'cpp',
  go: 'go',
  php: 'php',
  ruby: 'rb', rb: 'rb',
  sql: 'sql',
  yaml: 'yml', yml: 'yml',
  markdown: 'md', md: 'md',
  text: 'txt', '': 'txt',
};

function extFor(language) {
  return EXT_MAP[(language || '').toLowerCase()] || 'txt';
}

async function ensureDirs() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function readDb() {
  try {
    const content = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return []; // chưa tồn tại lần đầu, hoặc file rỗng/lỗi — bắt đầu với mảng rỗng
  }
}

async function appendToDb(record) {
  const db = await readDb();
  db.push(record);
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AI Capturer server đang hoạt động' });
});

app.post('/api/save-conversation', async (req, res) => {
  try {
    const { requestId, source, url, rawText, codeBlocks, capturedAt } = req.body;

    if (!requestId || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Thiếu requestId hoặc rawText' });
    }

    await ensureDirs();

    const savedAt = Date.now();
    const enrichedBlocks = [];

    for (let i = 0; i < (codeBlocks || []).length; i++) {
      const block = codeBlocks[i];
      const ext = extFor(block.language);
      const fileName = `${source || 'unknown'}_${requestId}_${i}.${ext}`;
      const filePath = path.join(OUTPUT_DIR, fileName);
      const relativePath = path.relative(__dirname, filePath);

      await fs.writeFile(filePath, block.code, 'utf-8');

      enrichedBlocks.push({
        index: i,                       // thứ tự block trong bài chat
        language: block.language,
        startIndex: block.startIndex,   // vị trí bắt đầu trong rawText — dùng để highlight lại
        endIndex: block.endIndex,       // vị trí kết thúc trong rawText
        fileName,
        filePath: relativePath,
        sizeBytes: Buffer.byteLength(block.code, 'utf-8'),
      });
    }

    const record = {
      requestId,
      source: source || 'unknown',
      url: url || '',
      capturedAt: capturedAt || savedAt,
      savedAt,
      rawText,          // giữ nguyên toàn bộ đoạn chat — không cắt xén, chỉ dùng để tham chiếu vị trí
      codeBlocks: enrichedBlocks,
    };

    await appendToDb(record);

    console.log(`[server] Đã lưu ${enrichedBlocks.length} code block(s) cho request ${requestId} (${source})`);
    res.json({ success: true, record });
  } catch (err) {
    console.error('[server] Lỗi lưu conversation:', err);
    res.status(500).json({ error: String(err) });
  }
});

// Tiện tra cứu lại — liệt kê toàn bộ conversation đã lưu
app.get('/api/conversations', async (req, res) => {
  const db = await readDb();
  res.json(db);
});

app.get('/api/conversations/:requestId', async (req, res) => {
  const db = await readDb();
  const record = db.find((r) => r.requestId === req.params.requestId);
  if (!record) return res.status(404).json({ error: 'Không tìm thấy' });
  res.json(record);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] AI Capturer server đang chạy tại http://0.0.0.0:${PORT}`);
  console.log(`[server] Code block sẽ lưu vào: ${OUTPUT_DIR}`);
  console.log(`[server] Index conversation: ${DB_FILE}`);
});
