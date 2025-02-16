require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const router = require('./router/index'); // Маршруты аутентификации и другие маршруты
const ticketsRouter = require('./router/ticketRoutes');
const paymentRouter = require('./router/paymentRoutes');
const errorMiddleware = require('./middlewares/error-middleware');
const flightRoutes = require('./router/flightRoutes');
const cityRoutes = require('./router/cityRoutes');
const bot = require('./bot');

const PORT = process.env.PORT || 5000;
const app = express();

const corsOptions = {
  origin: 'https://bustravel.co.ua', // Разрешаем только запросы с твоего фронтенда
  credentials: true,
  optionsSuccessStatus: 200 // Для поддержки старых браузеров
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api", router);
app.use('/api', ticketsRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/flights', flightRoutes);
app.use('/api', cityRoutes);
app.use(errorMiddleware);
app.get('/api/endpoint', (req, res) => {
  res.json({ message: 'Endpoint works!' });
});


const start = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    bot.on('message', (msg) => {
      console.log(`Admin Chat ID: ${msg.chat.id}`);
  });
  
    app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));

  } catch (e) {
    console.log(e);
  }
};

start();
