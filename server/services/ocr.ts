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
    const worker = await createWorker('eng');
    const { data: { text, confidence } } = await worker.recognize(imageBuffer);
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
