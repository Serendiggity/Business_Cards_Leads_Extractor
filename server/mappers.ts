// Mapper functions to convert snake_case database records to camelCase API responses
// This ensures consistent API contracts and eliminates field mapping issues

export function mapBusinessCardToCamelCase(record: any) {
  return {
    id: record.id,
    filename: record.filename,
    originalPath: record.originalPath,
    ocrText: record.ocrText,
    extractedData: record.extractedData,
    processingStatus: record.processingStatus,
    processingError: record.processingError,
    ocrConfidence: record.ocrConfidence,
    aiConfidence: record.aiConfidence,
    contactId: record.contactId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function mapBusinessCardsArray(records: any[]) {
  return records.map(mapBusinessCardToCamelCase);
}

export function mapContactToCamelCase(record: any) {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    company: record.company,
    title: record.title,
    industry: record.industry,
    address: record.address,
    website: record.website,
    notes: record.notes,
    tags: record.tags,
    businessCardId: record.businessCardId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function mapContactsArray(records: any[]) {
  return records.map(mapContactToCamelCase);
}