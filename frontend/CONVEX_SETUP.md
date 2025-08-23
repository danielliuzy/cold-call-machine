# Convex Database Setup Guide

## What's Been Set Up

✅ **Frontend Integration**: App.tsx updated with Convex hooks and URL storage functionality
✅ **Database Schema**: Created `convex/schema.ts` with URLs table structure
✅ **Database Functions**: Created `convex/urls.ts` with insert and query functions
✅ **Convex Configuration**: Created `convex.json` configuration file
✅ **Environment Setup**: Created `.env.local` template

## Next Steps to Complete Setup

### 1. Get Your Convex Deployment URL

1. Go to [convex.dev](https://convex.dev) and sign up/login
2. Create a new project called "cold-call-machine"
3. Copy your deployment URL (looks like: `https://your-project-name.convex.cloud`)

### 2. Update Environment Variables

Edit `frontend/.env.local` and replace the placeholder with your actual Convex URL:

```bash
VITE_CONVEX_URL=https://your-project-name.convex.cloud
```

### 3. Deploy Your Schema and Functions

Run this command in your terminal:

```bash
cd frontend
npx convex dev
```

This will:

- Push your schema to Convex
- Deploy your functions
- Generate TypeScript types

### 4. Test the Application

1. Start your dev server: `npm run dev`
2. Open http://localhost:5173
3. Enter a URL and click "Save URL"
4. The URL should be stored in your Convex database

## Features Added

- **URL Input Form**: Users can enter business website URLs
- **Save Button**: Stores URLs in Convex database with timestamp and status
- **URL Display**: Shows all stored URLs with creation time and status
- **Real-time Updates**: Uses Convex's reactive queries for live data

## Database Schema

The `urls` table stores:

- `url`: The business website URL
- `createdAt`: Timestamp when URL was added
- `status`: Current processing status (pending, processed, etc.)

## Future Enhancements

This foundation can be extended to:

- Add customer data extraction logic
- Integrate with Google Maps API
- Add phone call automation via Vapi
- Implement customer data storage and management
