import { contacts, businessCards, type Contact, type InsertContact, type BusinessCard, type InsertBusinessCard } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, desc, asc, sql, SQL, and } from "drizzle-orm";

type ContactColumn = keyof typeof contacts;
const contactColumns = Object.keys(contacts) as ContactColumn[];
function isContactColumn(key: string): key is ContactColumn {
    return contactColumns.includes(key as ContactColumn);
}

export interface IStorage {
  // Contact methods
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: number): Promise<Contact | undefined>;
  getAllContacts(limit?: number, offset?: number): Promise<Contact[]>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  searchContacts(criteria: any): Promise<Contact[]>;
  getContactsByIndustry(industry: string): Promise<Contact[]>;
  getContactsCount(): Promise<number>;
  
  // Business card methods
  createBusinessCard(businessCard: InsertBusinessCard): Promise<BusinessCard>;
  getBusinessCard(id: number): Promise<BusinessCard | undefined>;
  updateBusinessCard(id: number, updates: Partial<InsertBusinessCard>): Promise<BusinessCard | undefined>;
  getBusinessCardsByStatus(status: string): Promise<BusinessCard[]>;
  getRecentBusinessCards(limit: number, offset?: number): Promise<BusinessCard[]>;
  getBusinessCardsCount(): Promise<number>;
  
  // Statistics methods
  getStats(): Promise<{
    totalContacts: number;
    cardsProcessed: number;
    categories: number;
    accuracy: number;
  }>;
}

export class DatabaseStorage implements IStorage {
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
    // First, update any business cards that reference this contact
    await db.update(businessCards)
      .set({ contactId: null })
      .where(eq(businessCards.contactId, id));
    
    // Then delete the contact
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchContacts(criteria: any): Promise<Contact[]> {
    let query = db.select().from(contacts).$dynamic();

    if (criteria.where) {
      const whereClause = this.buildWhereClause(criteria.where);
      if (whereClause) {
        query = query.where(whereClause);
      }
    }

    if (criteria.orderBy && criteria.orderBy.column) {
      const orderFunction = criteria.orderBy.order === 'desc' ? desc : asc;
      switch (criteria.orderBy.column) {
        case 'name':
          query = query.orderBy(orderFunction(contacts.name));
          break;
        case 'createdAt':
          query = query.orderBy(orderFunction(contacts.createdAt));
          break;
        case 'company':
            query = query.orderBy(orderFunction(contacts.company));
            break;
        default:
          query = query.orderBy(desc(contacts.createdAt));
      }
    } else {
      query = query.orderBy(desc(contacts.createdAt));
    }

    return await query;
  }

  private buildWhereClause(where: any): SQL | undefined {
    if (!where) return undefined;
    
    const conditions: SQL[] = [];

    for (const key in where) {
        const condition = where[key];
        if (typeof condition !== 'object' || condition === null) continue;

        const operator = Object.keys(condition)[0];
        const operand = condition[operator];

        let sqlCondition: SQL | undefined;

        switch (key) {
            case "name":
                if (operator === 'ilike') sqlCondition = ilike(contacts.name, `%${operand}%`);
                break;
            case "email":
                if (operator === 'ilike') sqlCondition = ilike(contacts.email, `%${operand}%`);
                else if (operator === 'eq') sqlCondition = eq(contacts.email, operand);
                break;
            case "company":
                if (operator === 'ilike') sqlCondition = ilike(contacts.company, `%${operand}%`);
                break;
            case "title":
                if (operator === 'ilike') sqlCondition = ilike(contacts.title, `%${operand}%`);
                break;
            case "industry":
                if (operator === 'ilike') sqlCondition = ilike(contacts.industry, `%${operand}%`);
                break;
            case "createdAt":
                if (operator === 'gte') sqlCondition = sql`${contacts.createdAt} >= ${operand}`;
                else if (operator === 'lte') sqlCondition = sql`${contacts.createdAt} <= ${operand}`;
                break;
            case "and":
                if (Array.isArray(operand)) {
                    const nested = operand.map(c => this.buildWhereClause(c)).filter(c => c) as SQL[];
                    if (nested.length > 0) sqlCondition = and(...nested);
                }
                break;
            case "or":
                 if (Array.isArray(operand)) {
                    const nested = operand.map(c => this.buildWhereClause(c)).filter(c => c) as SQL[];
                    if (nested.length > 0) sqlCondition = or(...nested);
                }
                break;
        }

        if (sqlCondition) {
            conditions.push(sqlCondition);
        }
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return and(...conditions);
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

  async getRecentBusinessCards(limit: number, offset = 0): Promise<BusinessCard[]> {
    return await db
      .select()
      .from(businessCards)
      .orderBy(desc(businessCards.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getBusinessCardsCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(businessCards);
    return result.count;
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
