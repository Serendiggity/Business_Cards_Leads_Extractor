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
    
    // Configure OCR settings for better accuracy on business cards
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,@()-+#&/',
      tessedit_pageseg_mode: '6', // Assume uniform block of text
      preserve_interword_spaces: '1',
      tessedit_do_invert: '0'
    });
    
    const { data: { text, confidence, words } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    
    // Clean up the extracted text
    const cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s@.,()-+#&/]/g, '')
      .trim();
    
    // Calculate better confidence score based on word recognition
    const wordConfidences = words && words.length > 0 
      ? words.map(word => word.confidence || 0)
      : [];
    const avgWordConfidence = wordConfidences.length > 0 
      ? wordConfidences.reduce((a, b) => a + b, 0) / wordConfidences.length 
      : confidence;
    
    return {
      text: cleanedText,
      confidence: Math.min(avgWordConfidence / 100, 1.0),
      boundingBoxes: [] // Tesseract.js doesn't provide detailed bounding boxes in basic mode
    };
  } catch (error) {
    console.error('Tesseract OCR failed:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}
