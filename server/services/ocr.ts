import { createWorker } from 'tesseract.js';
import fs from 'fs';

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    bounds: Array<{ x: number; y: number }>;
  }>;
}

export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  console.log('Using Tesseract OCR to extract text from:', imagePath);
  
  try {
    const worker = await createWorker('eng');
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    await worker.terminate();
    
    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert to 0-1 range
      boundingBoxes: [] // Tesseract.js doesn't provide detailed bounding boxes in basic mode
    };
  } catch (error) {
    console.error('Tesseract OCR failed:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

export async function extractTextFromBuffer(imageBuffer: Buffer): Promise<OCRResult> {
  console.log('Using Tesseract OCR to extract text from buffer');
  
  try {
    // Validate buffer and format
    if (!imageBuffer || imageBuffer.length === 0) {
      console.error('Invalid or empty image buffer');
      return { text: '', confidence: 0, boundingBoxes: [] };
    }

    // Check for common image formats
    const signature = imageBuffer.toString('hex', 0, 8).toUpperCase();
    const isPNG = signature.startsWith('89504E47');
    const isJPEG = signature.startsWith('FFD8FF');
    const isWebP = signature.includes('57454250');
    const isGIF = signature.startsWith('47494638');
    const isBMP = signature.startsWith('424D');
    
    if (!isPNG && !isJPEG && !isWebP && !isGIF && !isBMP) {
      console.warn(`Unsupported image format detected. Signature: ${signature}`);
      return { text: '', confidence: 0, boundingBoxes: [] };
    }

    const worker = await createWorker('eng');
    const { data: { text, confidence } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    return {
      text: (text || '').trim(),
      confidence: Math.max(0, Math.min(1, (confidence || 0) / 100)), // Convert to 0-1 range with bounds
      boundingBoxes: [] // Tesseract.js doesn't provide detailed bounding boxes in basic mode
    };
  } catch (error: any) {
    console.error('Tesseract OCR failed:', error.message);
    
    // Return a safe fallback instead of crashing the server
    return {
      text: '',
      confidence: 0,
      boundingBoxes: []
    };
  }
}
