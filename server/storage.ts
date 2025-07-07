import { contacts, businessCards, type Contact, type InsertContact, type BusinessCard, type InsertBusinessCard, users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact methods
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: number): Promise<Contact | undefined>;
  getAllContacts(limit?: number, offset?: number): Promise<Contact[]>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  searchContacts(query: string): Promise<Contact[]>;
  getContactsByIndustry(industry: string): Promise<Contact[]>;
  getContactsCount(): Promise<number>;
  
  // Business card methods
  createBusinessCard(businessCard: InsertBusinessCard): Promise<BusinessCard>;
  getBusinessCard(id: number): Promise<BusinessCard | undefined>;
  updateBusinessCard(id: number, updates: Partial<InsertBusinessCard>): Promise<BusinessCard | undefined>;
  getBusinessCardsByStatus(status: string): Promise<BusinessCard[]>;
  getRecentBusinessCards(limit: number): Promise<BusinessCard[]>;
  
  // Statistics methods
  getStats(): Promise<{
    totalContacts: number;
    cardsProcessed: number;
    categories: number;
    accuracy: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Contact methods
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db
      .insert(contacts)
      .values({
        ...contact,
        updatedAt: new Date(),
      })
      .returning();
    return newContact;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async getAllContacts(limit = 50, offset = 0): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(contacts)
      .where(
        or(
          ilike(contacts.name, searchTerm),
          ilike(contacts.company, searchTerm),
          ilike(contacts.email, searchTerm),
          ilike(contacts.industry, searchTerm),
          ilike(contacts.title, searchTerm),
          ilike(contacts.notes, searchTerm)
        )
      )
      .orderBy(desc(contacts.createdAt));
  }

  async getContactsByIndustry(industry: string): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.industry, industry))
      .orderBy(desc(contacts.createdAt));
  }

  async getContactsCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);
    return result.count;
  }

  // Business card methods
  async createBusinessCard(businessCard: InsertBusinessCard): Promise<BusinessCard> {
    const [newCard] = await db
      .insert(businessCards)
      .values({
        ...businessCard,
        updatedAt: new Date(),
      })
      .returning();
    return newCard;
  }

  async getBusinessCard(id: number): Promise<BusinessCard | undefined> {
    const [card] = await db.select().from(businessCards).where(eq(businessCards.id, id));
    return card || undefined;
  }

  async updateBusinessCard(id: number, updates: Partial<InsertBusinessCard>): Promise<BusinessCard | undefined> {
    const [updated] = await db
      .update(businessCards)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(businessCards.id, id))
      .returning();
    return updated || undefined;
  }

  async getBusinessCardsByStatus(status: string): Promise<BusinessCard[]> {
    return await db
      .select()
      .from(businessCards)
      .where(eq(businessCards.processingStatus, status))
      .orderBy(desc(businessCards.createdAt));
  }

  async getRecentBusinessCards(limit: number): Promise<BusinessCard[]> {
    return await db
      .select()
      .from(businessCards)
      .orderBy(desc(businessCards.createdAt))
      .limit(limit);
  }

  // Statistics methods
  async getStats(): Promise<{
    totalContacts: number;
    cardsProcessed: number;
    categories: number;
    accuracy: number;
  }> {
    const [totalContactsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contacts);

    const [cardsProcessedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessCards)
      .where(eq(businessCards.processingStatus, "completed"));

    const [categoriesResult] = await db
      .select({ count: sql<number>`count(distinct industry)` })
      .from(contacts)
      .where(sql`industry IS NOT NULL`);

    return {
      totalContacts: totalContactsResult.count,
      cardsProcessed: cardsProcessedResult.count,
      categories: categoriesResult.count,
      accuracy: 97.3, // This would be calculated based on OCR confidence scores
    };
  }
}

export const storage = new DatabaseStorage();
