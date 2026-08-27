import { chromium } from 'playwright';

export class BrowserService {

   constructor() {
      this.browser = null;
      this.context = null;
      this.page = null;
      this.pages = [];

      console.log('[BrowserService] CREATED - PID:', process.pid);

   }

   async launch() {
      console.log(
         '[BrowserService] launch() - PID:',
         process.pid,
         'browser:',
         !!this.browser,
         'connected:',
         this.browser?.isConnected() ?? false
      );

      if (
         this.browser &&
         this.browser.isConnected() &&
         this.context
      ) {
         return this.browser;
      }

      this.browser = await chromium.launch({
         headless: false
      });

      this.context = await this.browser.newContext();

      this.browser.on('disconnected', () => {
         console.log('[BrowserService] Chromium disconnected');

         this.browser = null;
         this.context = null;
         this.page = null;
         this.pages = [];
      });

      return this.browser;
   }

   async open(url) {
      const browser = await this.launch();

      const page = await this.context.newPage();

      this.page = page;
      this.pages.push(page);

      await this.page.goto(url);

      return {
         title: await this.page.title(),
         url: this.page.url()
      };
   }

   async getContent() {
      if (!this.page) {
         throw new Error('Browser page is not open');
      }

      return await this.page.locator('body').innerText();
   }

   async close() {
      if (!this.browser) {
         return;
      }

      await this.browser.close();

      this.browser = null;
      this.context = null;
      this.page = null;
      this.pages = [];
   }

   isAlive() {
      return this.browser?.isConnected() ?? false;
   }

   async getPages() {
      if (!this.browser || !this.browser.isConnected()) {
         throw new Error('Browser is not open');
      }

      return this.pages.map((page, index) => ({
         index,
         url: page.url()
      }));
   }
}
