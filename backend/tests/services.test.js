import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import FileService from '../app/services/FileService.js';
import ConversationService from '../app/services/ConversationService.js';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const testPath = 'test-artifacts/services/nested/example.js';
const absoluteTestFile = path.join(projectRoot, testPath);
const repositoryFile = path.resolve('conversations.json');

async function removeArtifacts() {
  await fs.rm(path.dirname(absoluteTestFile), { recursive: true, force: true });
  await fs.rm(repositoryFile, { force: true });
}

test.afterEach(removeArtifacts);

test('FileService creates the directory and writes the requested filename', async () => {
  const directory = path.dirname(absoluteTestFile);
  const fileName = path.basename(absoluteTestFile);
  const writtenPath = await FileService.write(directory, fileName, 'console.log(1);');

  assert.equal(writtenPath, absoluteTestFile);
  assert.equal(await fs.readFile(absoluteTestFile, 'utf8'), 'console.log(1);');
});

test('ConversationService saves code using codeBlocks.path and code', async () => {
  const record = await ConversationService.save({
    requestId: 'test-request-path',
    source: 'test',
    rawText: '#test-artifacts/services/nested/example.js',
    codeBlocks: [{
      path: testPath,
      code: 'export default 42;',
      language: 'javascript',
      startIndex: 0,
      endIndex: 60,
    }],
  });

  assert.equal(await fs.readFile(absoluteTestFile, 'utf8'), 'export default 42;');
  assert.deepEqual(record.codeBlocks[0], {
    index: 0,
    language: 'javascript',
    startIndex: 0,
    endIndex: 60,
    path: testPath,
    fileName: 'example.js',
    filePath: testPath,
    sizeBytes: Buffer.byteLength('export default 42;', 'utf8'),
  });
});

test('ConversationService rejects paths outside the project', async () => {
  await assert.rejects(
    ConversationService.save({
      requestId: 'test-request-invalid-path',
      rawText: 'test',
      codeBlocks: [{ path: '../outside.js', code: 'bad' }],
    }),
    /path không hợp lệ/
  );
});
