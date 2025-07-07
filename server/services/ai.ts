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
          Extract the following information and return it as JSON:
          - name: Full name of the person
          - email: Email address
          - phone: Phone number (formatted cleanly)
          - company: Company name
          - title: Job title/position
          - industry: Industry category (choose from: Technology, Construction, Healthcare, Finance, Real Estate, Education, Manufacturing, Consulting, Marketing, Sales, Other)
          - address: Physical address
          - website: Website URL
          - confidence: Your confidence level (0-1) in the extraction accuracy
          
          Return only valid JSON. If information is not clearly present, omit that field.`
        },
        {
          role: "user",
          content: `Extract contact information from this business card text:\n\n${ocrText}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      name: result.name || undefined,
      email: result.email || undefined,
      phone: result.phone || undefined,
      company: result.company || undefined,
      title: result.title || undefined,
      industry: result.industry || undefined,
      address: result.address || undefined,
      website: result.website || undefined,
      confidence: result.confidence || 0.8,
    };
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
