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

// Инициализация файлов, если они не существуют
const initFiles = () => {
  const files = [USERS_PATH, CHANNELS_PATH];
  files.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
      console.log(`File ${path.basename(filePath)} created`);
    }
  });
};

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ['Content-Type', 'X-User-ID', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// Проверка авторизации для JSON-файлов
app.use((req, res, next) => {
  if (req.path.endsWith('.json') && req.method === 'GET') {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'X-User-ID header required' });
    }
  }
  next();
});

// Обработка необработанных исключений
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Функции для работы с JSON-файлами
const readJSONFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    console.log(`Reading ${path.basename(filePath)}:`, data.slice(0, 50));
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${path.basename(filePath)}:`, error);
    return [];
  }
};

const writeJSONFile = (filePath, data) => {
  try {
    console.log(`Writing to ${path.basename(filePath)}:`, data.slice(0, 50));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${path.basename(filePath)}:`, error);
    return false;
  }
};

// Валидация данных пользователей
const validateUsers = (users) => {
  return Array.isArray(users) && users.every(user => 
    user.id && typeof user.id === 'number' &&
    user.name && typeof user.name === 'string'
  );
};

// Валидация данных каналов
const validateChannels = (channels) => {
  return Array.isArray(channels) && channels.every(channel =>
    channel.id && typeof channel.id === 'number' &&
    channel.name && typeof channel.name === 'string'
  );
};

// Endpoints для пользователей
app.get('/users.json', (req, res) => {
  const users = readJSONFile(USERS_PATH);
  res.json(users);
});

app.put('/users.json', (req, res) => {
  if (!validateUsers(req.body)) {
    return res.status(400).json({ error: 'Invalid user data structure' });
  }
  writeJSONFile(USERS_PATH, req.body);
  io.emit('users-updated', req.body);
  res.status(204).send();
});

// Endpoints для каналов
app.get('/channels.json', (req, res) => {
  const channels = readJSONFile(CHANNELS_PATH);
  res.json(channels);
});

app.put('/channels.json', (req, res) => {
  if (!validateChannels(req.body)) {
    return res.status(400).json({ error: 'Invalid channel data structure' });
  }
  writeJSONFile(CHANNELS_PATH, req.body);
  io.emit('channels-updated', req.body);
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

// Запуск сервера
server.listen(PORT, '0.0.0.0', () => {
  initFiles();
  console.log(`Server running on port ${PORT}`);
});
