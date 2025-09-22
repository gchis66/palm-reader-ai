# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Palm Reader AI is a Vite-based web application that provides AI-powered palm readings. Users can upload photos of their palms and receive detailed mystical readings powered by Anthropic's Claude API, with Stripe integration for payments.

## Development Commands

### Core Commands
- `npm run dev` - Start Vite development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

### Testing & Quality
This project does not currently have automated tests configured. When implementing new features, manual testing should be performed by running the development server and testing the upload/payment flow.

## Architecture

### Frontend Structure
- **Entry Point**: `index.html` - Main HTML file with embedded Stripe integration
- **Core Logic**: `src/script.js` - Handles camera functionality, file uploads, Stripe payments, and UI interactions
- **Styling**: `style.css` - Contains all application styles including modal and responsive design
- **Utilities**: `src/base64-utils.js` - Helper functions for base64 encoding

### Backend (Vercel Serverless Functions)
- **Upload Handler**: `api/upload/index.js` - Processes palm images with async polling pattern for Vercel timeout handling
- **Payment Handler**: `api/create-payment-intent/index.js` - Creates Stripe payment intents
- **Upload Base64**: `api/upload-base64/` - Alternative upload endpoint for base64 encoded images

### Utility Modules
- **AI Integration**: `utils/anthropic.js` - Handles communication with Claude API for palm readings
- **Payment Processing**: `utils/stripe.js` - Manages Stripe payment intent creation

### Key Integrations
- **Anthropic Claude**: Uses `claude-sonnet-4-20250514` model for palm reading analysis
- **Stripe**: Processes $4.99 payments for premium palm readings  
- **Vercel**: Serverless deployment with static file hosting

### Environment Variables Required
- `ANTHROPIC_API_KEY` - For Claude API access
- `STRIPE_API_KEY` - For payment processing
- Stripe publishable key is hardcoded in frontend (should be moved to env variable)

### Deployment Configuration
- **vercel.json**: Configures Vercel builds for both serverless functions and static assets
- **Vite**: Used for development and build tooling
- **Static Assets**: Images stored in `/images/` directory

### Important Implementation Details
- Upload endpoint uses async polling pattern to handle Vercel's 10-second function timeout
- Multipart form data is manually parsed in serverless functions
- In-memory storage is used for request tracking (resets on cold starts)
- Payment flow includes a paywall system that shows preview content before payment