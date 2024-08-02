const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const QRCode = require('qrcode');
const ticketService = require('../service/ticket-service');
const authMiddleware = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user-model');
const bot = require("../bot");

const adminChatId = ['5581268424', '1067260096'];

// Middleware для перевірки токена
const verifyToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log('Decoded token:', decoded); // Додано логування декодованого токену
    req.user = await UserModel.findById(decoded.id);
    if (!req.user) {
      console.log('User not found');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Створення квитка
router.post('/tickets', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      from, fromLocation, to, toLocation,
      typeEN, typeUA, passengers, priceEN, priceUA,
      date_departure, departure, duration, date_arrival, arrival,
      smallBaggage, largeBaggage, email, firstName, lastName, phone, language
    } = req.body;

    const ticketData = {
      from,
      fromLocation,
      to,
      toLocation,
      typeEN,
      typeUA,
      passengers,
      priceEN,
      priceUA,
      date_departure,
      departure,
      duration,
      date_arrival,
      arrival,
      baggage: {
        smallBaggage,
        largeBaggage
      },
      email,
      firstName,
      lastName,
      phone,
      user: userId,
      language
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();

    const message = `
    🚌 *Нова заявка на квиток!*
    👤 *Ім'я*: ${firstName} ${lastName}
    📅 *Дата відправлення*: ${date_departure}
    🔄 *Маршрут*: ${from} - ${to}
    📧 *Email*: ${email}
    📞 *Телефон*: ${phone}
    `;

    // Відправляємо повідомлення всім адміністраторам
    adminChatIds.forEach(async (chatId) => {
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
});

// Отримання квитків користувача
router.get('/tickets', verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const tickets = await Ticket.find({ user: userId });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

router.get('/all-tickets', async (req, res) => {
  try {
    const tickets = await Ticket.find();  
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ message: 'Error fetching all tickets', error: error.message });
  }
});

// Генерація QR-коду для квитка
router.get('/qrcode/:id', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ _id: req.params.id, user: req.user._id });
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticketData = {
      id: ticket._id,
      from: ticket.from,
      to: ticket.to,
      date_departure: ticket.date_departure,
      isActive: ticket.isActive
    };

    const qrCodeData = JSON.stringify(ticketData);
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    res.send(qrCodeImage);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
});


router.get('/qrcode/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      console.error('Токен не надано');
      return res.status(401).json({ message: 'Токен не надано' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      console.log('Декодований токен:', decoded);
    } catch (err) {
      console.error('Некоректний токен:', err);
      return res.status(401).json({ message: 'Некоректний токен' });
    }

    const { ticketId, userId } = decoded;

    if (!ticketId || !userId) {
      console.error('Некоректний payload токена');
      return res.status(401).json({ message: 'Некоректний payload токена' });
    }

    // Перевірка чи є ticketId валідним ObjectId
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      console.error('Некоректний формат ticket ID');
      return res.status(400).json({ message: 'Некоректний формат ticket ID' });
    }

    const ticketObjectId = new mongoose.Types.ObjectId(ticketId);

    const ticket = await Ticket.findOne({ _id: ticketObjectId, user: userId }).lean();
    if (!ticket) {
      return res.status(404).json({ message: 'Квиток не знайдено' });
    }

    const ticketData = {
      _id: ticket._id,
      from: ticket.from,
      fromLocation: ticket.fromLocation,
      to: ticket.to,
      toLocation: ticket.toLocation,
      typeEN: ticket.typeEN,
      typeUA: ticket.typeUA,
      passengers: ticket.passengers,
      priceEN: ticket.priceEN,
      priceUA: ticket.priceUA,
      date_departure: ticket.date_departure,
      departure: ticket.departure,
      duration: ticket.duration,
      date_arrival: ticket.date_arrival,
      arrival: ticket.arrival,
      baggage: ticket.baggage,
      firstName: ticket.firstName,
      lastName: ticket.lastName,
      email: ticket.email,
      phone: ticket.phone,
      language: ticket.language 
    };

    res.json(ticketData);
  } catch (error) {
    console.error('Помилка під час отримання даних квитка:', error);
    res.status(500).json({ message: 'Помилка під час отримання даних квитка', error: error.message });
  }
});

// Оновлення статусу квитка та відправка email
router.put('/tickets/toggle/:id', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.isActive = !ticket.isActive;

    if (ticket.isActive && !ticket.emailSent) {
      const userId = ticket.user.toString();

      // Генеруємо токен для QR-коду
      const qrCodeToken = ticketService.generateQRCodeToken(ticket._id, userId);

      // Створюємо URL для QR-коду
      const qrCodeLink = `${process.env.CLIENT_URL}/qrcode/${qrCodeToken}`;

      // Відправляємо email з квитком
      await ticketService.sendTicketMail(ticket.email, ticket, qrCodeLink);

      // Оновлюємо поле emailSent
      ticket.emailSent = true;
    }

    await ticket.save();
    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error toggling ticket status:', error);
    res.status(500).json({ message: 'Error toggling ticket status', error: error.message });
  }
});


// Функція генерації токена
function generateToken(ticketId, userId) {
  const payload = { ticketId, userId };
  const options = { expiresIn: '30d' }; // Токен дійсний 30 днів
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, options);
}


module.exports = router;
