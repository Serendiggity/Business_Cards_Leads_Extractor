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
  console.log('AI extraction input text:', ocrText);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting contact information from business card text. 
          The text may be noisy or contain OCR errors, so be flexible in your interpretation.
          
          Extract the following information and return it as JSON:
          - name: Full name of the person (required - try to identify even if imperfect)
          - email: Email address (look for @ symbols and common email patterns)
          - phone: Phone number (look for number patterns, format cleanly)
          - company: Company name or organization
          - title: Job title/position
          - industry: Industry category (choose from: Technology, Construction, Healthcare, Finance, Real Estate, Education, Manufacturing, Consulting, Marketing, Sales, Other)
          - address: Physical address
          - website: Website URL (look for www. or .com patterns)
          - confidence: Your confidence level (0-1) in the extraction accuracy
          
          IMPORTANT: 
          - Always provide at least a name, even if uncertain
          - Be generous with confidence scores if you extract any meaningful data
          - If you find ANY contact information (name, phone, email, company), set confidence to at least 0.3
          - Only use very low confidence (< 0.2) if the text appears to be completely unrelated to business cards
          
          Return only valid JSON. If information is not clearly present, omit that field.`
        },
        {
          role: "user",
          content: `Extract contact information from this business card text:\n\n${ocrText}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const choice = response.choices[0];
    if (choice.message.content) {
      console.log('AI extraction raw output:', choice.message.content);
      const data = JSON.parse(choice.message.content);
      console.log('Parsed AI extraction data:', data);
      return data;
    }
    
    // Fallback if content is null
    return { confidence: 0 };
  } catch(error) {
    console.error('Error processing AI extraction:', error);
    return { confidence: 0 };
  }
}

export async function processNaturalLanguageQuery(query: string): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a smart contact database assistant. Given a natural language query about contacts, 
          analyze the query and return a JSON object with filtering criteria for a Drizzle ORM query.
          
          Return JSON with these possible fields, using Drizzle operators where applicable:
          - where: An object that can contain operators like 'or', 'and', 'ilike', 'eq', 'gte', 'lte'.
            - For text searches, use 'ilike' for case-insensitive matching.
            - For date searches, use 'gte' or 'lte'.
          - orderBy: An object with 'column' and 'order' ('asc' or 'desc').
          
          Examples:
          "construction industry" -> {"where": {"industry": {"ilike": "Construction"}}}
          "recent contacts from TechCorp" -> {"where": {"and": [{"company": {"ilike": "TechCorp"}}, {"createdAt": {"gte": "2024-01-01T00:00:00.000Z"}}]}, "orderBy": {"column": "createdAt", "order": "desc"}}
          "john from construction" -> {"where": {"and": [{"name": {"ilike": "john"}}, {"industry": {"ilike": "Construction"}}]}}`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: { type: "json_object" },
    });

    const criteria = JSON.parse(response.choices[0].message.content || '{}');
    return criteria;
  } catch(e) {
    console.error("Error processing natural language query", e)
    return {}
  }
}
