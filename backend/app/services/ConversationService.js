import path from 'node:path';
import { fileURLToPath } from 'node:url';

import FileService from './FileService.js';
import ConversationRepository
   from '../repositories/ConversationRepository.js';

const PROJECT_ROOT = path.resolve(
   path.dirname(fileURLToPath(import.meta.url)),
   '../../..'
);

class ConversationService {

   static EXT_MAP = {
      javascript: 'js',
      js: 'js',

      typescript: 'ts',
      ts: 'ts',

      jsx: 'jsx',
      tsx: 'tsx',

      python: 'py',
      py: 'py',

      json: 'json',

      bash: 'sh',
      shell: 'sh',
      sh: 'sh',

      html: 'html',

      css: 'css',
      scss: 'scss',

      java: 'java',

      c: 'c',
      cpp: 'cpp',
      'c++': 'cpp',

      go: 'go',

      php: 'php',

      ruby: 'rb',
      rb: 'rb',

      sql: 'sql',

      yaml: 'yml',
      yml: 'yml',

      markdown: 'md',
      md: 'md',

      text: 'txt',
      '': 'txt'
   };

   static extFor(language) {
      return (
         this.EXT_MAP[
         (language || '').toLowerCase()
         ] || 'txt'
      );
   }

   static outputPathFor(blockPath) {
      if (typeof blockPath !== 'string' || !blockPath.trim()) {
         const error = new Error('Mỗi code block phải có path');
         error.statusCode = 400;
         throw error;
      }

      const normalizedPath = path.normalize(blockPath.trim());
      if (path.isAbsolute(normalizedPath) || normalizedPath === '..' || normalizedPath.startsWith(`..${path.sep}`)) {
         const error = new Error('Code block path không hợp lệ');
         error.statusCode = 400;
         throw error;
      }
      return normalizedPath;
   }

   static async save(data) {
      const {
         requestId,
         source,
         url,
         rawText,
         codeBlocks,
         capturedAt
      } = data;

      if (
         !requestId ||
         typeof rawText !== 'string'
      ) {
         const error = new Error(
            'Thiếu requestId hoặc rawText'
         );

         error.statusCode = 400;

         throw error;
      }

      const savedAt = Date.now();

      const outputDir = PROJECT_ROOT;

      const enrichedBlocks = [];

      for (
         let i = 0;
         i < (codeBlocks || []).length;
         i++
      ) {
         const block = codeBlocks[i];

         const relativeOutputPath = this.outputPathFor(block.path);
         const relativeDirectory = path.dirname(relativeOutputPath);
         const fileName = path.basename(relativeOutputPath);
         const directoryPath = path.join(outputDir, relativeDirectory);

         const absolutePath =
            await FileService.write(
               directoryPath,
               fileName,
               block.code
            );

         const relativePath =
            path.relative(
               PROJECT_ROOT,
               absolutePath
            );

         enrichedBlocks.push({
            index: i,
            language: block.language,
            startIndex: block.startIndex,
            endIndex: block.endIndex,
            path: relativeOutputPath,
            fileName,
            filePath: relativePath,
            sizeBytes: Buffer.byteLength(
               block.code,
               'utf-8'
            )
         });
      }

      const record = {
         requestId,
         source: source || 'unknown',
         url: url || '',
         capturedAt:
            capturedAt || savedAt,
         savedAt,
         rawText,
         codeBlocks: enrichedBlocks
      };

      await ConversationRepository.save(
         record
      );

      console.log(
         `[service] Đã lưu ${enrichedBlocks.length} code block(s) cho request ${requestId} (${source})`
      );

      return record;
   }

   static async findAll() {
      return ConversationRepository.findAll();
   }

   static async findByRequestId(
      requestId
   ) {
      return ConversationRepository
         .findByRequestId(requestId);
   }
}

export default ConversationService;