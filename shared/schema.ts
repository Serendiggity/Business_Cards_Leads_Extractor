import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  date: timestamp('date'),
  notes: text('notes'),
  userId: text('user_id').notNull(), // from Clerk
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  title: text('title'),
  industry: text('industry'),
  address: text('address'),
  website: text('website'),
  notes: text('notes'),
  tags: text('tags').array(),
  eventId: integer('event_id').references(() => events.id),
  userId: text('user_id').notNull(), // from Clerk
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const businessCards = pgTable('business_cards', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull(),
  originalPath: text('original_path').notNull(),
  ocrText: text('ocr_text'),
  extractedData: jsonb('extracted_data'),
  processingStatus: text('processing_status').notNull().default('pending'), // pending, processing, completed, failed
  processingError: text('processing_error'), // Store error details if processing fails
  ocrConfidence: real('ocr_confidence'), // OCR confidence score (0-1)
  aiConfidence: real('ai_confidence'), // AI extraction confidence score (0-1)
  contactId: integer('contact_id').references(() => contacts.id),
  userId: text('user_id').notNull(), // from Clerk
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const businessCardRelations = relations(businessCards, ({ one }) => ({
  contact: one(contacts, {
    fields: [businessCards.contactId],
    references: [contacts.id],
  }),
}));

export const contactRelations = relations(contacts, ({ many, one }) => ({
  businessCards: many(businessCards),
  event: one(events, {
    fields: [contacts.eventId],
    references: [events.id],
  }),
}));

export const eventRelations = relations(events, ({ many }) => ({
  contacts: many(contacts),
}));

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessCardSchema = createInsertSchema(businessCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type BusinessCard = typeof businessCards.$inferSelect;
export type InsertBusinessCard = z.infer<typeof insertBusinessCardSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
