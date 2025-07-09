import type { Express, Request, Response } from 'express';
import { createServer, type Server } from 'http';
import { storage } from './storage';
import { extractTextFromBuffer } from './services/ocr';
import {
  extractContactDataFromText,
  processNaturalLanguageQuery,
} from './services/ai';
import {
  insertContactSchema,
  insertBusinessCardSchema,
  insertEventSchema,
} from '@shared/schema';
import {
  mapBusinessCardsArray,
  mapContactsArray,
  mapContactToCamelCase,
  mapEventsArray,
  mapEventToCamelCase,
} from './mappers';
import { asyncHandler, createError } from './middleware/errorHandler';
import { requireAuth } from './middleware/clerk';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          'Invalid file type. Only JPG, PNG, GIF, BMP, WEBP, and PDF files are allowed.',
        ),
      );
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Search contacts with natural language (must be before /api/contacts/:id)
  app.get(
    '/api/contacts/search',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const query = req.query.q as string;

      if (!query) {
        throw createError('Query parameter is required', 400);
      }

      // Process natural language query to get search criteria
      const criteria = await processNaturalLanguageQuery(query);

      // Perform search using the criteria
      const filteredContacts = await storage.searchContacts(criteria, userId);

      res.json({ contacts: mapContactsArray(filteredContacts) });
    }),
  );

  // Get all contacts with pagination
  app.get(
    '/api/contacts',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const contacts = await storage.getAllContacts(userId, limit, offset);
      const totalCount = await storage.getContactsCount(userId);

      res.json({
        contacts: mapContactsArray(contacts),
        totalCount,
        hasMore: offset + contacts.length < totalCount,
      });
    }),
  );

  // Get single contact
  app.get(
    '/api/contacts/:id',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid contact ID', 400);
      }

      const contact = await storage.getContact(id, userId);

      if (!contact) {
        throw createError('Contact not found', 404);
      }

      res.json(mapContactToCamelCase(contact));
    }),
  );

  // Create contact
  app.post(
    '/api/contacts',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact({
        ...validatedData,
        userId: userId,
      });
      res.status(201).json(contact);
    }),
  );

  // Update contact
  app.put(
    '/api/contacts/:id',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid contact ID', 400);
      }

      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(id, userId, validatedData);

      if (!contact) {
        throw createError('Contact not found', 404);
      }

      res.json(mapContactToCamelCase(contact));
    }),
  );

  // Delete contact
  app.delete(
    '/api/contacts/:id',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid contact ID', 400);
      }

      const success = await storage.deleteContact(id, userId);

      if (!success) {
        throw createError('Contact not found', 404);
      }

      res.json({ message: 'Contact deleted successfully' });
    }),
  );

  // Upload business card
  app.post(
    '/api/business-cards/upload',
    requireAuth,
    upload.single('businessCard'),
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      if (!req.file) {
        throw createError('No file uploaded', 400);
      }

      const file = req.file as Express.Multer.File;

      // Create business card record
      const businessCard = await storage.createBusinessCard({
        filename: file.originalname,
        originalPath: file.path,
        processingStatus: 'processing',
        userId: userId,
      });

      // Process in background
      processBusinessCard(businessCard.id, file.path, userId);

      res.status(201).json({
        id: businessCard.id,
        filename: businessCard.filename,
        status: 'processing',
        message: 'Business card uploaded and processing started',
      });
    }),
  );

  // Get business card processing status with detailed reporting
  app.get(
    '/api/business-cards/:id/status',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid business card ID', 400);
      }

      const businessCard = await storage.getBusinessCard(id, userId);

      if (!businessCard) {
        throw createError('Business card not found', 404);
      }

      res.json({
        id: businessCard.id,
        filename: businessCard.filename,
        status: businessCard.processingStatus,
        contactId: businessCard.contactId,
        processingError: businessCard.processingError,
        ocrConfidence: businessCard.ocrConfidence,
        aiConfidence: businessCard.aiConfidence,
        extractedData: businessCard.extractedData,
        createdAt: businessCard.createdAt,
        updatedAt: businessCard.updatedAt,
      });
    }),
  );

  // Verify and create a contact from a business card
  app.post(
    '/api/business-cards/:id/verify',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const businessCardId = parseInt(req.params.id);
      if (isNaN(businessCardId)) {
        throw createError('Invalid business card ID', 400);
      }

      const validatedData = insertContactSchema.parse(req.body);

      // Create the new contact with the verified data
      const contact = await storage.createContact({
        ...validatedData,
        userId: userId,
      });

      // Update the business card to link it to the new contact and mark as completed
      await storage.updateBusinessCard(businessCardId, {
        contactId: contact.id,
        processingStatus: 'completed',
        processingError: null, // Clear any previous error messages
      });

      res
        .status(200)
        .json({
          message: 'Contact verified and created successfully',
          contact,
        });
    }),
  );

  // Get recent uploads with pagination
  app.get(
    '/api/business-cards/recent',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;
      const offset = (page - 1) * limit;

      const recentCards = await storage.getRecentBusinessCards(
        userId,
        limit,
        offset,
      );
      const totalCount = await storage.getBusinessCardsCount(userId);
      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        data: mapBusinessCardsArray(recentCards),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    }),
  );

  // Get dashboard statistics
  app.get(
    '/api/stats',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const stats = await storage.getStats(userId);
      res.json(stats);
    }),
  );

  // --- Event Routes ---

  // Get all events
  app.get(
    '/api/events',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const events = await storage.getAllEvents(userId);
      res.json(mapEventsArray(events));
    }),
  );

  // Get single event
  app.get(
    '/api/events/:id',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid event ID', 400);
      }
      const event = await storage.getEvent(id, userId);
      if (!event) {
        throw createError('Event not found', 404);
      }
      res.json(mapEventToCamelCase(event));
    }),
  );

  // Create event
  app.post(
    '/api/events',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({
        ...validatedData,
        userId: userId,
      });
      res.status(201).json(mapEventToCamelCase(event));
    }),
  );

  // Update event
  app.put(
    '/api/events/:id',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid event ID', 400);
      }
      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, userId, validatedData);
      if (!event) {
        throw createError('Event not found', 404);
      }
      res.json(mapEventToCamelCase(event));
    }),
  );

  // Delete event
  app.delete(
    '/api/events/:id',
    requireAuth,
    asyncHandler(async (req: Request, res: Response) => {
      const { userId } = req.auth;
      if (!userId) {
        throw createError('User not authenticated', 401);
      }
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        throw createError('Invalid event ID', 400);
      }
      const success = await storage.deleteEvent(id, userId);
      if (!success) {
        throw createError('Event not found', 404);
      }
      res.json({ message: 'Event deleted successfully' });
    }),
  );

  // Background processing function
  async function processBusinessCard(
    businessCardId: number,
    imagePath: string,
    userId: string,
  ) {
    try {
      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);

      // Extract text using OCR
      const ocrResult = await extractTextFromBuffer(imageBuffer);
      const ocrConfidence = ocrResult.confidence;

      // Update business card with OCR text
      await storage.updateBusinessCard(businessCardId, {
        ocrText: ocrResult.text,
        processingStatus: 'processing',
        ocrConfidence: ocrConfidence,
      });

      // Check if OCR was successful
      if (ocrConfidence === 0 || !ocrResult.text) {
        console.log(
          `OCR completely failed for business card ${businessCardId}`,
        );
        await storage.updateBusinessCard(businessCardId, {
          processingStatus: 'failed',
          processingError:
            'Unable to extract text from image. Please ensure the image is clear and in a supported format (JPG, PNG, GIF, BMP).',
        });
        return;
      }

      // Extract contact data using AI
      const contactData = await extractContactDataFromText(ocrResult.text);
      const aiConfidence = contactData.confidence;

      // --- REVISED CONFIDENCE LOGIC ---

      // 1. Check for low OCR confidence first
      if (ocrConfidence < 0.5) {
        console.log(
          `OCR confidence is low (${ocrConfidence}), queuing for verification for business card ${businessCardId}`,
        );
        await storage.updateBusinessCard(businessCardId, {
          processingStatus: 'pending-verification',
          processingError: `Low OCR confidence (${Math.round(ocrConfidence * 100)}%). Please verify extracted data.`,
          extractedData: contactData,
          aiConfidence: aiConfidence,
        });
        return; // Stop processing
      }

      // 2. Check for low AI confidence
      if (aiConfidence < 0.15) {
        console.log(
          `AI extraction confidence too low (${aiConfidence}) for business card ${businessCardId}`,
        );
        await storage.updateBusinessCard(businessCardId, {
          processingStatus: 'pending-verification',
          processingError: `Low AI confidence (${Math.round(aiConfidence * 100)}%). Please verify extracted data.`,
          extractedData: contactData,
          aiConfidence: aiConfidence,
        });
        return; // Stop processing
      }

      // 3. If all checks pass, proceed to create the contact
      console.log(
        `Confidence checks passed for business card ${businessCardId}`,
      );
      const contact = await storage.createContact({
        name: contactData.name || 'Unknown',
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company,
        title: contactData.title,
        industry: contactData.industry,
        address: contactData.address,
        website: contactData.website,
        notes: `Extracted from business card with ${Math.round(contactData.confidence * 100)}% confidence`,
        userId: userId,
      });

      // Update business card with contact link and completion status
      await storage.updateBusinessCard(businessCardId, {
        contactId: contact.id,
        extractedData: contactData,
        processingStatus: 'completed',
        aiConfidence: aiConfidence,
      });

      // Clean up uploaded file
      fs.unlinkSync(imagePath);

      console.log(`Business card ${businessCardId} processed successfully`);
    } catch (error) {
      console.error(`Error processing business card ${businessCardId}:`, error);

      // Update status to failed with error details
      await storage.updateBusinessCard(businessCardId, {
        processingStatus: 'failed',
        processingError: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
