const express = require('express');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = require('http').createServer(app);
// Замените строку с портом
const PORT = process.env.PORT || 3001;

// Обновите CORS настройки
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
});


const initFiles = () => {
  const files = ['users.json', 'channels.json'];
  files.forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '[]');
      console.log(`Файл ${file} создан.`);
    }
  });
};

const USERS_PATH = path.join(__dirname, './users.json');
const CHANNELS_PATH = path.join(__dirname, './channels.json');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ['Content-Type', 'X-User-ID', 'Authorization']
}));

// Добавляем middleware для проверки аутентификации
app.use((req, res, next) => {
  if (req.path.endsWith('.json') && req.method === 'GET') {
      const userId = req.headers['x-user-id'];
      if (!userId) {
          return res.status(401).json({ error: 'Unauthorized' });
      }
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

app.use(express.json());

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

// Маршруты для работы с users.json
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

// Маршруты для работы с channels.json
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

// Запуск сервера
// В server.js после создания сервера
server.listen(PORT, '0.0.0.0', () => {
  initFiles();
  console.log(`Server running on port ${PORT}`);
});