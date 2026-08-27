import fs from 'node:fs/promises';
import path from 'node:path';

export default class FileService {

   async write(filePath, content) {
      const absolutePath = path.resolve(filePath);

      await fs.mkdir(path.dirname(absolutePath), {
         recursive: true
      });

      await fs.writeFile(
         absolutePath,
         content,
         'utf-8'
      );

      return absolutePath;
   }
}