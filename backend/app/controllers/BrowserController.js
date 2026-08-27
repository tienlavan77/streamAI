import { BrowserService } from '../services/BrowserService.js';

const browserService = new BrowserService();

export class BrowserController {

   static async open(req, res) {
      try {
         const result = await browserService.open(
            req.body.url
         );

         res.json(result);
      } catch (error) {
         res.status(500).json({
            error: error.message
         });
      }
   }

   static async close(req, res) {
      try {
         const result = await browserService.close();

         res.json(result);
      } catch (error) {
         res.status(500).json({
            error: error.message
         });
      }
   }

   static async launch(req, res) {
      try {
         const result = await browserService.launch();

         res.json(result);
      } catch (error) {
         res.status(500).json({
            error: error.message
         });
      }
   }

   static status(req, res) {
      try {
         const result = browserService.isAlive();

         res.json({ isAlive: result });
      } catch (error) {
         res.status(500).json({
            error: error.message
         });
      }
   }

   static async content(req, res) {
      try {
         const result = await browserService.getContent();

         return res.json({
            content: result
         });
      } catch (error) {
         return res.status(500).json({
            error: error.message
         });
      }
   }
   static async pages(req, res) {
      try {
         const pages = await browserService.getPages();

         return res.json({
            pages
         });
      } catch (error) {
         return res.status(500).json({
            error: error.message
         });
      }
   }
} 