# AI Business Development Assistant

## Overview

This is a full-stack AI-powered business development assistant designed to automate contact capture and management. The application allows users to photograph business cards, automatically extract contact information using OCR and AI, and store it in a searchable database. Built with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system variables

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **File Upload**: Multer for handling business card image uploads
- **API Design**: RESTful endpoints with JSON responses

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM with type-safe schema definitions
- **File Storage**: Local file system for uploaded business card images
- **Schema**: Two main tables - contacts and business_cards with proper relations

## Key Components

### Database Schema
- **Contacts Table**: Stores extracted contact information including name, email, phone, company, title, industry, etc.
- **Business Cards Table**: Stores uploaded files, OCR text, processing status, and extracted data
- **Relations**: One-to-many relationship between contacts and business cards

### OCR Service
- **Google Cloud Vision API**: Extracts text from business card images
- **Processing Pipeline**: Handles image buffers and returns structured text data
- **Error Handling**: Graceful fallback for OCR failures

### AI Service
- **OpenAI GPT-4**: Extracts structured contact data from OCR text
- **Natural Language Processing**: Processes queries for contact search
- **Industry Classification**: Categorizes contacts into predefined industries

### File Upload System
- **Drag & Drop Interface**: User-friendly file upload with progress tracking
- **File Validation**: Supports JPG, PNG, and PDF formats with size limits
- **Processing Queue**: Asynchronous processing of uploaded business cards

## Data Flow

1. **Upload Process**:
   - User uploads business card image via drag-and-drop interface
   - File is validated and stored locally
   - OCR service extracts text from image
   - AI service processes OCR text to extract structured contact data
   - Contact information is stored in database

2. **Query Process**:
   - User searches contacts using natural language queries
   - AI service interprets query and converts to database operations
   - Results are returned with pagination and filtering

3. **Contact Management**:
   - Users can view, edit, and manage contact information
   - Tags and notes can be added for better organization
   - Statistics dashboard shows processing metrics

## External Dependencies

### Core Services
- **Google Cloud Vision API**: OCR text extraction from images
- **OpenAI GPT-4**: AI-powered data extraction and query processing
- **Supabase**: PostgreSQL database hosting with real-time capabilities

### Development Tools
- **Vite**: Frontend build tool with HMR
- **Drizzle Kit**: Database migrations and schema management
- **Tailwind CSS**: Utility-first CSS framework
- **Replit Integration**: Development environment support

### UI Components
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Modern icon library
- **React Hook Form**: Form validation and management
- **React Dropzone**: File upload functionality

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Fast development iteration
- **Environment Variables**: Separate configs for dev/prod

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code for Node.js
- **Database**: Automated migrations with Drizzle Kit
- **Static Assets**: Served via Express with proper caching

### Environment Requirements
- Node.js runtime environment
- PostgreSQL database (Supabase)
- Google Cloud Vision API credentials
- OpenAI API key for AI processing

## Changelog

```
Changelog:
- July 07, 2025: Initial setup and implementation of Phase 1
  * Complete AI Business Development Assistant MVP deployed
  * Business card upload with drag-and-drop interface
  * OCR text extraction using Tesseract.js (real text recognition)
  * AI-powered contact data extraction using OpenAI GPT-4o
  * Natural language search functionality
  * PostgreSQL database with contacts and business cards tables
  * Dashboard with statistics and contact management
  * Responsive UI with Tailwind CSS and Radix UI components
  * All core Phase 1 features working: upload, process, search, manage

- July 07, 2025: Enhanced UI and Fixed Critical Issues
  * Fixed dynamic page updates - UI now refreshes automatically after uploads
  * Added contact delete functionality with confirmation dialog
  * Fixed confidence score display bug (field name mapping issue)
  * Enhanced processing status reporting with accurate OCR and AI confidence metrics
  * Improved error handling and user feedback throughout the application
  * All features now working seamlessly: upload, process, view confidence scores, delete contacts

- July 07, 2025: Database Migration and API Improvements
  * Successfully migrated from Neon to Supabase database
  * Implemented professional mapper functions for consistent API responses
  * Fixed all field mapping issues between backend (snake_case) and frontend (camelCase)
  * Enhanced Recent Uploads with collapsible functionality and pagination (5 or 10 items per page)
  * Applied systematic approach to API design following best practices
  * All database operations now use Supabase with proper connection pooling
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```