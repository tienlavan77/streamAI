import fs from 'node:fs/promises';
import path from 'node:path';

class ConversationRepository {

   constructor() {
      this.filePath = path.resolve(
         'conversations.json'
      );
   }

   async findAll() {
      try {
         const content = await fs.readFile(
            this.filePath,
            'utf-8'
         );

         return JSON.parse(content);
      } catch {
         return [];
      }
   }

   async save(record) {
      const conversations =
         await this.findAll();

      conversations.push(record);

      await fs.writeFile(
         this.filePath,
         JSON.stringify(
            conversations,
            null,
            2
         ),
         'utf-8'
      );

      return record;
   }

   async findByRequestId(requestId) {
      const conversations =
         await this.findAll();

      return conversations.find(
         conversation =>
            conversation.requestId === requestId
      );
   }
}

export default new ConversationRepository();