import OpenAI from "openai";
import { InsertContact } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ExtractedContactData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  industry?: string;
  address?: string;
  website?: string;
  confidence: number;
}

export async function extractContactDataFromText(ocrText: string): Promise<ExtractedContactData> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting contact information from business card text. 
          
          CRITICAL RULES:
          1. Only extract information that is clearly visible and readable in the text
          2. Do not make assumptions or fill in missing data
          3. Be extremely conservative with confidence scoring
          4. If text appears garbled, OCR-corrupted, or unclear, significantly reduce confidence
          5. Email addresses must contain @ symbol to be valid
          6. Phone numbers should preserve original formatting when possible
          7. Company names should not include job titles or personal names
          8. If fewer than 3 fields are extractable, set confidence below 0.5
          
          Extract the following information and return as JSON:
          - name: Full name of the person (first and last name)
          - email: Email address (must contain @ symbol)
          - phone: Phone number (preserve formatting)
          - company: Company name only
          - title: Job title/position
          - industry: Best match from: Technology, Construction, Healthcare, Finance, Real Estate, Education, Manufacturing, Consulting, Marketing, Sales, Legal, Other
          - address: Complete physical address
          - website: Website URL
          - confidence: Your confidence level (0-1) in the extraction accuracy
          
          Return only valid JSON. If information is not clearly present, omit that field.
          Be very conservative with confidence - if you're unsure, lower the score.`
        },
        {
          role: "user",
          content: `Extract contact information from this business card text. Be precise and conservative:\n\n"${ocrText}"`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.0, // More deterministic results
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and clean extracted data
    const cleanedData = {
      name: result.name?.trim() || undefined,
      email: result.email?.includes('@') ? result.email.trim() : undefined,
      phone: result.phone?.trim() || undefined,
      company: result.company?.trim() || undefined,
      title: result.title?.trim() || undefined,
      industry: result.industry?.trim() || undefined,
      address: result.address?.trim() || undefined,
      website: result.website?.trim() || undefined,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5))
    };
    
    // Calculate quality-based confidence adjustment
    const fieldsFound = Object.values(cleanedData).filter(v => v !== undefined).length - 1; // -1 for confidence
    const minimumFields = 3; // Name, email/phone, company
    
    if (fieldsFound < minimumFields) {
      cleanedData.confidence = Math.min(cleanedData.confidence, 0.4);
    }
    
    // Additional validation for key fields
    if (cleanedData.name && cleanedData.name.length < 3) {
      cleanedData.confidence = Math.min(cleanedData.confidence, 0.3);
    }
    
    return cleanedData;
  } catch (error) {
    console.error('AI extraction failed:', error);
    throw new Error(`AI extraction failed: ${error.message}`);
  }
}

export async function processNaturalLanguageQuery(query: string, contacts: any[]): Promise<any[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a smart contact database assistant. Given a natural language query about contacts, 
          analyze the query and return a JSON object with filtering criteria.
          
          Return JSON with these possible fields:
          - searchTerms: array of terms to search across all fields
          - industry: specific industry filter
          - company: specific company filter
          - timeframe: if query mentions time (recent, last week, etc.)
          - tags: specific tags to filter by
          - sortBy: field to sort by (name, company, date, etc.)
          - sortOrder: "asc" or "desc"
          
          Examples:
          "construction industry" -> {"industry": "Construction"}
          "recent contacts" -> {"timeframe": "recent", "sortBy": "date", "sortOrder": "desc"}
          "people from TechCorp" -> {"company": "TechCorp"}
          "john from construction" -> {"searchTerms": ["john"], "industry": "Construction"}`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
    });

    const criteria = JSON.parse(response.choices[0].message.content || '{}');
    
    // Apply filtering logic based on criteria
    let filteredContacts = contacts;
    
    if (criteria.searchTerms && criteria.searchTerms.length > 0) {
      filteredContacts = filteredContacts.filter(contact => {
        const searchableText = `${contact.name || ''} ${contact.company || ''} ${contact.email || ''} ${contact.title || ''} ${contact.industry || ''} ${contact.notes || ''}`.toLowerCase();
        return criteria.searchTerms.some(term => searchableText.includes(term.toLowerCase()));
      });
    }
    
    if (criteria.industry) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.industry && contact.industry.toLowerCase().includes(criteria.industry.toLowerCase())
      );
    }
    
    if (criteria.company) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.company && contact.company.toLowerCase().includes(criteria.company.toLowerCase())
      );
    }
    
    // Apply sorting
    if (criteria.sortBy) {
      filteredContacts.sort((a, b) => {
        const fieldA = a[criteria.sortBy] || '';
        const fieldB = b[criteria.sortBy] || '';
        
        if (criteria.sortOrder === 'desc') {
          return fieldB.localeCompare(fieldA);
        } else {
          return fieldA.localeCompare(fieldB);
        }
      });
    }
    
    return filteredContacts;
  } catch (error) {
    console.error('Natural language query processing failed:', error);
    // Fall back to basic text search if AI fails
    return contacts.filter(contact => {
      const searchableText = `${contact.name || ''} ${contact.company || ''} ${contact.email || ''} ${contact.title || ''} ${contact.industry || ''} ${contact.notes || ''}`.toLowerCase();
      return searchableText.includes(query.toLowerCase());
    });
  }
}
