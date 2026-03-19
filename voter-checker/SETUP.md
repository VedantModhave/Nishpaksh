# Quick Setup Guide

## Installation

```bash
cd voter-checker
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Build for Production

```bash
npm run build
npm start
```

## Environment

No environment variables needed! The app connects directly to ECI APIs.

## Troubleshooting

### CAPTCHA not loading
- Check your internet connection
- The ECI API might be rate-limited
- Try refreshing the CAPTCHA

### Search not working
- Make sure CAPTCHA is entered correctly (lowercase)
- Verify EPIC number format
- State selection is important for faster results

## Features

✅ Auto-generate CAPTCHA
✅ Search by EPIC number
✅ Beautiful voter details display
✅ Responsive design
✅ Real-time ECI API integration

