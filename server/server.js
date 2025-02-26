const express = require('express');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = require('http').createServer(app);
const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ['Content-Type', 'X-User-ID']
  }
});

const USERS_PATH = path.join(__dirname, 'users.json');
const CHANNELS_PATH = path.join(__dirname, 'channels.json');

const initFiles = () => {
  const files = [USERS_PATH, CHANNELS_PATH];
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
      console.log(`File ${path.basename(filePath)} created`);
    }
  });
};

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ['Content-Type', 'X-User-ID', 'Authorization'],
  credentials: true
}));

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: 'unsafe-inline' 'unsafe-eval';" +
    "style-src 'self' https: 'unsafe-inline';" +
    "img-src 'self' https: data:;" +
    "font-src 'self' https: data:;" +
    "connect-src 'self' https: ws: wss:;"
  );
  next();
});

app.use(express.json());

app.use((req, res, next) => {
  if (req.path.endsWith('.json') && req.method === 'GET') {
    const userId = req.headers['x-user-id'];

    // if (!userId) {
    //   return res.status(401).json({ error: 'Authorization header required' });
    // }
  }
  next();
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

const readJSONFile = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
};

const writeJSONFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
};

// Users endpoints
app.get('/users.json', (req, res) => {
  const users = readJSONFile(USERS_PATH);
  res.json(users);
});

app.put('/users.json', (req, res) => {
  const updatedUsers = req.body;
  if (!Array.isArray(updatedUsers)) {
    return res.status(400).send('Invalid data format');
  }
  writeJSONFile(USERS_PATH, updatedUsers);
  io.emit('users-updated', updatedUsers);
  res.status(204).send();
});

// Channels endpoints
app.get('/channels.json', (req, res) => {
  const channels = readJSONFile(CHANNELS_PATH);
  res.json(channels);
});

app.put('/channels.json', (req, res) => {
  const updatedChannels = req.body;
  if (!Array.isArray(updatedChannels)) {
    return res.status(400).send('Invalid data format');
  }
  writeJSONFile(CHANNELS_PATH, updatedChannels);
  io.emit('channels-updated', updatedChannels);
  res.status(204).send();
});

// WebSocket
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('message', (data) => {
    socket.broadcast.emit('message', data);
    
    const channels = readJSONFile(CHANNELS_PATH);
    const updatedChannels = channels.map(channel => {
      if (channel.id === data.channelId) {
        return {
          ...channel,
          messages: [...channel.messages, data.message]
        };
      }
      return channel;
    });

    writeJSONFile(CHANNELS_PATH, updatedChannels);
    io.emit('channels-updated', updatedChannels);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  initFiles();
  console.log(`Server running on port ${PORT}`);
});
