import fs from 'node:fs/promises';
import path from 'node:path';

class FileService {
   /**
    * Creates the directory and writes code to the requested filename.
    * Returns the absolute path so callers can store a stable relative path.
    */
   async write(directoryPath, fileName, code) {
      const absoluteDirectory = path.resolve(directoryPath);
      const absolutePath = path.join(absoluteDirectory, fileName);

      await fs.mkdir(absoluteDirectory, { recursive: true });
      await fs.writeFile(absolutePath, code, 'utf-8');

      return absolutePath;
   }
}

export default new FileService();
