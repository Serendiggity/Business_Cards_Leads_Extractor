import { GoogleAuth } from 'google-auth-library';
import { v1 as vision } from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes: Array<{
    text: string;
    bounds: Array<{ x: number; y: number }>;
  }>;
}

export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  try {
    const [result] = await client.textDetection(imagePath);
    const detections = result.textAnnotations || [];
    
    if (detections.length === 0) {
      throw new Error('No text detected in image');
    }

    const fullText = detections[0].description || '';
    const confidence = detections[0].confidence || 0.95;
    
    const boundingBoxes = detections.slice(1).map(detection => ({
      text: detection.description || '',
      bounds: detection.boundingPoly?.vertices || []
    }));

    return {
      text: fullText,
      confidence,
      boundingBoxes
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

export async function extractTextFromBuffer(imageBuffer: Buffer): Promise<OCRResult> {
  try {
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations || [];
    
    if (detections.length === 0) {
      throw new Error('No text detected in image');
    }

    const fullText = detections[0].description || '';
    const confidence = detections[0].confidence || 0.95;
    
    const boundingBoxes = detections.slice(1).map(detection => ({
      text: detection.description || '',
      bounds: detection.boundingPoly?.vertices || []
    }));

    return {
      text: fullText,
      confidence,
      boundingBoxes
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}
