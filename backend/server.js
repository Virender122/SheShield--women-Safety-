const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads', 'incidents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Incident = require('./models/Incident');
const Guardian = require('./models/Guardian');
const Settings = require('./models/Settings');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Allowed Origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|.*\.ngrok-free\.app|.*\.ngrok\.io|.*\.localtunnel\.me|.*\.loca\.lt|.*\.pinggy(-free)?\.link|.*\.vercel\.app)(:\d+)?$/.test(origin);
                      
    if (isAllowed) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
};

// Socket.IO Setup
const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use((req, res, next) => {
  console.log(`🛡️ [REQ] ${req.method} ${req.url} | Origin: ${req.headers.origin || 'none'}`);
  next();
});
app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' }
});

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/women-safety';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// ==========================================
// TWILIO SETUP (SMS Notifications)
// ==========================================
const getTwilioClient = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return null;
};

const sendSOSSMS = async (toPhone, toName, userName, lat, lon) => {
  const client = getTwilioClient();
  if (!client) {
    console.log('⚠️  Twilio not configured - skipping SMS for', toName);
    return { success: false, error: 'Twilio not configured' };
  }

  // Ensure E.164 formatting (prepend +91 if 10 digits) for Twilio
  let formattedPhone = toPhone.toString().trim();
  if (formattedPhone.length === 10 && /^\d+$/.test(formattedPhone)) {
    formattedPhone = `+91${formattedPhone}`;
  } else if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+${formattedPhone}`;
  }

  const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
  const messageBody = `🚨 EMERGENCY SOS ALERT 🚨\n${userName} has triggered an SOS and needs immediate help.\n\nDear ${toName},\nPlease check on them. Live Location:\n${mapsLink}`;
  
  try {
    // 1. Send SMS
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    console.log(`📱 SOS SMS sent to ${formattedPhone}: ${message.sid}`);

    // 2. Make Voice Call
    const call = await client.calls.create({
      twiml: `<Response><Say voice='alice'>Emergency SOS Alert. ${userName} has triggered an S O S and needs immediate help. Dear ${toName}, please check on them immediately. Their live location is available on the app.</Say></Response>`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });
    console.log(`📞 SOS Call sent to ${formattedPhone}: ${call.sid}`);

    return { success: true, messageId: message.sid, callId: call.sid };
  } catch (error) {
    console.error(`❌ Failed to send SOS Alert to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
  }
};

// ==========================================
// ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SheShield Women Safety API is running 🛡️' });
});

// ---------- AUTH ROUTES ----------

app.post('/api/auth/signup', authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    user = new User({ name, email, password, phone });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // Create default settings for new user
    await Settings.create({ userId: user._id });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- SOS ROUTES ----------

app.post('/api/sos/activate', authMiddleware, async (req, res) => {
  const { lat, lon } = req.body;
  console.log(`🚨 SOS Activated by user ${req.userId} at Lat: ${lat}, Lon: ${lon}`);

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all guardians for this user
    const guardians = await Guardian.find({ userId: req.userId });
    
    const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;

    if (twilioConfigured && guardians.length > 0) {
      // Fire-and-forget: Send SOS SMS in background (parallel) without blocking the response
      guardians.forEach(guardian => {
        if (guardian.phone) {
          sendSOSSMS(guardian.phone, guardian.name, user.name, lat, lon)
            .catch(error => console.error(`❌ Background SOS SMS to ${guardian.phone} failed:`, error.message));
        }
      });
      
      return res.json({
        success: true,
        status: 'ACTIVATED',
        timestamp: new Date().toISOString(),
        message: `Emergency SOS activated! Dispatching SMS alerts to ${guardians.length} guardian(s) in background.`
      });
    }

    // If Twilio not configured or no guardians with phone
    let message = 'SOS signal activated.';
    if (!twilioConfigured) {
      message += ' SMS alerts not configured — please set up Twilio in backend .env file.';
    }
    if (guardians.length === 0) {
      message += ' No guardians configured — please add emergency contacts in Settings.';
    }

    res.json({
      success: true,
      status: 'ACTIVATED',
      timestamp: new Date().toISOString(),
      message
    });
  } catch (err) {
    console.error('SOS Error:', err);
    res.status(500).json({ success: false, error: 'Failed to process SOS alert.' });
  }
});

app.post('/api/sos/deactivate', authMiddleware, (req, res) => {
  console.log(`✅ SOS Deactivated by user ${req.userId}`);
  res.json({ success: true, status: 'DEACTIVATED', timestamp: new Date().toISOString() });
});

app.post('/api/sos/fake-call', authMiddleware, (req, res) => {
  res.json({ success: true, delaySeconds: 30, incomingCaller: 'Mom' });
});

// ---------- INCIDENT ROUTES ----------

app.post('/api/incidents/report', authMiddleware, upload.single('media'), async (req, res) => {
  try {
    let mediaUrl = '';
    if (req.file) {
      mediaUrl = `/uploads/incidents/${req.file.filename}`;
    }

    const newIncident = new Incident({
      ...req.body,
      mediaUrl,
      userId: req.userId
    });
    await newIncident.save();

    // Broadcast new incident to all connected clients
    io.emit('new_incident', newIncident);

    // Send SMS to authority if configured
    const authorityPhone = process.env.AUTHORITY_PHONE_NUMBER;
    const client = getTwilioClient();
    if (client && authorityPhone) {
      const serverUrl = process.env.FRONTEND_URL || 'http://localhost:5005';
      const fullMediaUrl = mediaUrl ? `${serverUrl}${mediaUrl}` : 'No media attached';
      const messageBody = `🚨 INCIDENT REPORT: ${newIncident.title} 🚨\nType: ${newIncident.type}\nSeverity: ${newIncident.severity}\nLocation: ${newIncident.location}\nDesc: ${newIncident.description}\nMedia: ${fullMediaUrl}`;
      
      client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: authorityPhone
      }).catch(err => console.error('Failed to send authority SMS:', err.message));
    }

    res.json({ success: true, report: newIncident });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/incidents/my-reports', authMiddleware, async (req, res) => {
  try {
    const incidents = await Incident.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/incidents/all', authMiddleware, async (req, res) => {
  try {
    // Fetch recent incidents (last 30 days) that have valid coordinates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const incidents = await Incident.find({
      createdAt: { $gte: thirtyDaysAgo },
      lat: { $ne: '' },
      lon: { $ne: '' }
    }).sort({ createdAt: -1 }).limit(100);
    
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- COMMUNITY ROUTES ----------

app.get('/api/community/messages', async (req, res) => {
  try {
    const posts = await Post.find().sort({ timestamp: -1 }).limit(100);
    res.json(posts.reverse()); // Return oldest first for chat display
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/community/message', authMiddleware, async (req, res) => {
  const { content, replyTo } = req.body;
  try {
    const user = await User.findById(req.userId);
    const newPost = new Post({
      username: user ? user.name : 'Anonymous',
      content,
      replyTo: replyTo || null
    });
    await newPost.save();

    // Broadcast to all connected Socket.IO clients
    io.emit('new_message', newPost);

    res.json(newPost);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- GUARDIAN ROUTES ----------

app.get('/api/guardians', authMiddleware, async (req, res) => {
  try {
    const guardians = await Guardian.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ success: true, guardians });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/guardians', authMiddleware, async (req, res) => {
  try {
    const { guardians } = req.body; // Array of guardian objects

    // Delete existing guardians for this user and replace with new list
    await Guardian.deleteMany({ userId: req.userId });

    const guardianDocs = guardians.map(g => ({
      userId: req.userId,
      name: g.name,
      relation: g.relation,
      phone: g.phone,
      email: g.email || ''
    }));

    const saved = await Guardian.insertMany(guardianDocs);
    res.json({ success: true, guardians: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- USER SETTINGS ROUTES ----------

app.get('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.userId });
    if (!settings) {
      settings = await Settings.create({ userId: req.userId });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/settings', authMiddleware, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.userId },
      { ...req.body, updatedAt: Date.now() },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- AI BOT ROUTES ----------

app.post('/api/bot/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured in backend.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "You are the 'SheShield Safety Assistant', a supportive, empathetic, and knowledgeable AI companion integrated into a women's safety app. Your main goal is to provide safety advice, emergency preparedness tips, emotional support, and general guidance. Keep responses concise, helpful, and reassuring. Do not hallucinate emergency services phone numbers; instead, tell them to use the SOS button or call local authorities."
    });

    // Format history for Gemini
    let formattedHistory = history ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })) : [];

    // Gemini requires the first message in history to be from 'user'
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    res.json({ success: true, response: responseText });
  } catch (err) {
    console.error('Bot Error:', err);
    res.status(500).json({ success: false, error: 'Failed to communicate with AI Bot.' });
  }
});

// ---------- ROUTES OPTIMIZE (Real data from frontend's routeService) ----------

app.post('/api/routes/optimize', (req, res) => {
  const { source, destination } = req.body;
  // The frontend already uses real OpenRouteService + Overpass APIs directly.
  // This endpoint is kept for backward compatibility but the frontend 
  // now handles routing via routeService.js with real APIs.
  res.json({
    source,
    destination,
    message: 'Route optimization is handled client-side via OpenRouteService API.'
  });
});

// ==========================================
// SOCKET.IO - Real-time Community Chat
// ==========================================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// ==========================================
// START SERVER
// ==========================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🛡️  SheShield Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  
  const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
  if (twilioConfigured) {
    console.log(`📱 Twilio configured - SOS SMS will be sent from ${process.env.TWILIO_PHONE_NUMBER}`);
  } else {
    console.log(`⚠️  Twilio not configured - SOS SMS disabled. Update .env to enable.`);
  }
});
