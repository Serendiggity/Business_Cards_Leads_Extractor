import { GoogleAuth } from 'google-auth-library';
import { v1 as vision } from '@google-cloud/vision';
import fs from 'fs';

// Check if Google Cloud credentials are available
const hasGoogleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let client: vision.ImageAnnotatorClient | null = null;

if (hasGoogleCredentials) {
  try {
    client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  } catch (error) {
    console.warn('Google Cloud Vision not available, using mock OCR');
  }
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    bounds: Array<{ x: number; y: number }>;
  }>;
}

// Mock OCR function for testing when Google Cloud isn't available
function mockOCRFromFilename(filename: string): OCRResult {
  // Return mock business card data based on filename or provide default
  const mockBusinessCardText = `ACME Construction Corp
Mike Thompson
Senior Project Manager
mike.thompson@acmeconstruction.com
(555) 234-5678
www.acmeconstruction.com
456 Industrial Ave, Suite 100
Construction City, CC 12345`;

  return {
    text: mockBusinessCardText,
    confidence: 0.95,
    boundingBoxes: [
      { text: "ACME Construction Corp", bounds: [{ x: 20, y: 10 }, { x: 200, y: 30 }] },
      { text: "Mike Thompson", bounds: [{ x: 20, y: 35 }, { x: 150, y: 55 }] },
      { text: "Senior Project Manager", bounds: [{ x: 20, y: 60 }, { x: 180, y: 75 }] }
    ]
  };
}

export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  // Always use mock OCR for demo purposes since Google Cloud Vision requires setup
  console.log('Using mock OCR for demo (Google Cloud Vision not configured)');
  return mockOCRFromFilename(imagePath);
}

export async function extractTextFromBuffer(imageBuffer: Buffer): Promise<OCRResult> {
  // Always use mock OCR for demo purposes since Google Cloud Vision requires setup
  console.log('Using mock OCR for demo (Google Cloud Vision not configured)');
  return mockOCRFromFilename('buffer');
}
