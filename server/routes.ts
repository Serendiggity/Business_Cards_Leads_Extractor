import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { extractTextFromBuffer } from "./services/ocr";
import { extractContactDataFromText, processNaturalLanguageQuery } from "./services/ai";
import { insertContactSchema, insertBusinessCardSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, SVG, and PDF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Search contacts with natural language (must be before /api/contacts/:id)
  app.get("/api/contacts/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: 'Query parameter is required' });
      }
      
      // Get all contacts for AI processing
      const allContacts = await storage.getAllContacts(1000, 0);
      
      // Process natural language query
      const filteredContacts = await processNaturalLanguageQuery(query, allContacts);
      
      res.json({ contacts: filteredContacts });
    } catch (error: any) {
      console.error('Error searching contacts:', error);
      res.status(500).json({ message: 'Failed to search contacts', error: error.message });
    }
  });

  // Get all contacts with pagination
  app.get("/api/contacts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const contacts = await storage.getAllContacts(limit, offset);
      const totalCount = await storage.getContactsCount();
      
      res.json({
        contacts,
        totalCount,
        hasMore: offset + contacts.length < totalCount
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });

  // Get single contact
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contact = await storage.getContact(id);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error fetching contact:', error);
      res.status(500).json({ message: 'Failed to fetch contact' });
    }
  });

  // Create contact
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      res.status(400).json({ message: 'Failed to create contact', error: error.message });
    }
  });

  // Update contact
  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, validatedData);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json(contact);
    } catch (error: any) {
      console.error('Error updating contact:', error);
      res.status(400).json({ message: 'Failed to update contact', error: error.message });
    }
  });

  // Delete contact
  app.delete("/api/contacts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContact(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ message: 'Failed to delete contact' });
    }
  });



  // Upload business card
  app.post("/api/business-cards/upload", upload.single('businessCard'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file as Express.Multer.File;
      
      // Create business card record
      const businessCard = await storage.createBusinessCard({
        filename: file.originalname,
        originalPath: file.path,
        processingStatus: 'processing'
      });

      // Process in background
      processBusinessCard(businessCard.id, file.path);

      res.status(201).json({
        id: businessCard.id,
        filename: businessCard.filename,
        status: 'processing',
        message: 'Business card uploaded and processing started'
      });
    } catch (error) {
      console.error('Error uploading business card:', error);
      res.status(500).json({ message: 'Failed to upload business card' });
    }
  });

  // Get business card processing status
  app.get("/api/business-cards/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const businessCard = await storage.getBusinessCard(id);
      
      if (!businessCard) {
        return res.status(404).json({ message: 'Business card not found' });
      }
      
      res.json({
        id: businessCard.id,
        filename: businessCard.filename,
        status: businessCard.processingStatus,
        contactId: businessCard.contactId
      });
    } catch (error) {
      console.error('Error fetching business card status:', error);
      res.status(500).json({ message: 'Failed to fetch business card status' });
    }
  });

  // Get recent uploads
  app.get("/api/business-cards/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const recentCards = await storage.getRecentBusinessCards(limit);
      res.json(recentCards);
    } catch (error) {
      console.error('Error fetching recent business cards:', error);
      res.status(500).json({ message: 'Failed to fetch recent business cards' });
    }
  });

  // Get dashboard statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics' });
    }
  });

  // Background processing function
  async function processBusinessCard(businessCardId: number, imagePath: string) {
    try {
      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Extract text using OCR
      const ocrResult = await extractTextFromBuffer(imageBuffer);
      
      // Update business card with OCR text
      await storage.updateBusinessCard(businessCardId, {
        ocrText: ocrResult.text,
        processingStatus: 'processing'
      });
      
      // Extract contact data using AI
      const contactData = await extractContactDataFromText(ocrResult.text);
      
      // Create contact record
      const contact = await storage.createContact({
        name: contactData.name || 'Unknown',
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        title: contactData.title,
        industry: contactData.industry,
        address: contactData.address,
        website: contactData.website,
        notes: `Extracted from business card with ${Math.round(contactData.confidence * 100)}% confidence`
      });
      
      // Update business card with contact link and completion status
      await storage.updateBusinessCard(businessCardId, {
        contactId: contact.id,
        extractedData: contactData,
        processingStatus: 'completed'
      });
      
      // Clean up uploaded file
      fs.unlinkSync(imagePath);
      
      console.log(`Business card ${businessCardId} processed successfully`);
    } catch (error) {
      console.error(`Error processing business card ${businessCardId}:`, error);
      
      // Update status to failed
      await storage.updateBusinessCard(businessCardId, {
        processingStatus: 'failed'
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
