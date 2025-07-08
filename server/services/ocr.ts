import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
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

async function preProcessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
        const processedImageBuffer = await sharp(imageBuffer)
            .negate({ alpha: false }) // Invert colors, keeping it to 3 channels (no alpha)
            .grayscale() // Convert to grayscale
            .normalize() // Improve contrast
            .toBuffer();
        return processedImageBuffer;
    } catch (error: any) {
        console.error('Sharp image pre-processing failed:', error);
        // If sharp fails, return the original buffer and let Tesseract try
        return imageBuffer;
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

    const worker = await createWorker('eng');
    const preprocessedBuffer = await preProcessImage(imageBuffer);
    const { data: { text, confidence } } = await worker.recognize(preprocessedBuffer);
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
