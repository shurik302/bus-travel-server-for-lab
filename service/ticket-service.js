const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
require('dotenv').config();

class TicketService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  }

  generateQRCodeToken(ticketId, userId) {
    const payload = { ticketId, userId };
    const options = { expiresIn: '30d' }; // Token valid for 30 days
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, options);
  }

  async sendTicketMail(to, ticketData) {
    if (!to) {
      console.error("Recipient email address is not specified");
      throw new Error('Recipient email address is not specified');
    }

    if (!this.validateEmail(to)) {
      console.error(`Invalid recipient email address format: ${to}`);
      throw new Error('Invalid recipient email address format');
    }

    const formatDate = (date, time) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Kiev' };
      const formattedDate = new Date(date).toLocaleDateString(ticketData.language === 'ua' ? 'uk-UA' : 'en-US', options);
      return `${formattedDate} о ${time}`;
    };

    // Select price based on user's language
    const price = ticketData.language === 'ua' ? ticketData.priceUA : ticketData.priceEN;
    const currency = ticketData.language === 'ua' ? 'грн' : '$';

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: 'Ваш квиток',
        text: `Доброго дня, ${ticketData.firstName} ${ticketData.lastName}, Вас вітає наш сайт. Ми раді повідомити, що Ваш квиток було придбано успішно!`,
        html: `
         <table width=100% cellpadding="0" cellspacing="0" border="0" style="background-color: #f2f2f2;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width=100% cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 20px; font-family: 'Open Sans', sans-serif;">
              <h1 style="font-size: 30px; font-weight: 500; margin: 0;">Доброго дня, ${ticketData.firstName} ${ticketData.lastName}, Вас вітає
                <span style="font-size: 30px; font-weight: 600; color:#2356ff;">Bustravel!</span>
              </h1>
              <p style="font-size: 20px; font-weight: 400; margin: 0;">Ми раді повідомити, що Ваш квиток було придбано успішно!</p>
              <p style="font-size: 20px; font-weight: 400; margin: 0;">Деталі поїздки українською</p>
              <p style="font-size: 14px; font-weight: 300; margin: 0;">(Версія англійською нижче/The English version is below):</p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="1" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; font-size: 30px; font-weight: 600; text-align: center;">Маршрут</td>
                  <td style="padding: 10px; font-size: 30px; font-weight: 600; text-align: center;">Час</td>
                  <td style="padding: 10px; font-size: 30px; font-weight: 600; text-align: center;">Додаткова інформація</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-size: 20px; font-weight: 400;">
                    <p style="margin: 0;">Звідки: ${ticketData.from}</p>
                    <p style="margin: 0;">Куди: ${ticketData.to}</p>
                  </td>
                  <td style="padding: 10px; font-size: 20px; font-weight: 400;">
                    <p style="margin: 0;">Дата та час відправлення: ${formatDate(ticketData.date_departure, ticketData.departure)}</p>
                    <p style="margin: 0;">Дата та час прибуття: ${formatDate(ticketData.date_arrival, ticketData.arrival)}</p>
                  </td>
                  <td style="padding: 10px; font-size: 20px; font-weight: 400;">
                    <p style="margin: 0;">Ціна квитка: ${ticketData.priceUA} грн.</p>
                    <p style="margin: 0;">Кількість пасажирів: ${ticketData.passengers}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid black;  border-top: none; font-size: 14px; font-weight: 300;">
              <p style="margin: 0; ">Цей квиток є дійсним документом, який підтверджує ваше право на проїзд з пункту відправлення до пункту призначення, зазначених у квитку. При наданні цього квитка водію, пасажир, на ім'я якого було придбано квиток, має право на проїзд. Квиток дійсний протягом всієї поїздки. Дякуємо за вибір <span style="font-size: 14px; font-weight: 400; color:#2356ff;">Bustravel!</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; font-family: 'Open Sans', sans-serif;">
              <h1 style="font-size: 30px; font-weight: 500; margin-top: 80px;">Hello, ${ticketData.firstName} ${ticketData.lastName}, <span style="font-size: 30px; font-weight: 600; color:#2356ff;">Bustravel!</span> welcomes you!</h1>
              <p style="font-size: 20px; font-weight: 400; margin: 0;">We are happy to inform you that your ticket was purchased successfully!</p>
              <p style="font-size: 20px; font-weight: 400; margin: 0;">Details of the trip in English</p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="1" style="border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; font-size: 30px; font-weight: 600; text-align: center;">Route</td>
                  <td style="padding: 10px; font-size: 30px; font-weight: 600; text-align: center;">Time</td>
                  <td style="padding: 10px; font-size: 30px; font-weight: 600; text-align: center;">Additional information</td>
                </tr>
                <tr>
                  <td style="padding: 10px; font-size: 20px; font-weight: 400;">
                    <p style="margin: 0;">Where from: ${ticketData.from}</p>
                    <p style="margin: 0;">Where arriving: ${ticketData.to}</p>
                  </td>
                  <td style="padding: 10px; font-size: 20px; font-weight: 400;">
                    <p style="margin: 0;">Date and time of departure: ${formatDate(ticketData.date_departure, ticketData.departure)}</p>
                    <p style="margin: 0;">Date and time of arrival: ${formatDate(ticketData.date_arrival, ticketData.arrival)}</p>
                  </td>
                  <td style="padding: 10px; font-size: 20px; font-weight: 400;">
                    <p style="margin: 0;">Ticket price: ${ticketData.priceEN} грн.</p>
                    <p style="margin: 0;">The number of passengers: ${ticketData.passengers}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid black;  border-top: none; font-size: 14px; font-weight: 300;">
              <p style="margin: 0;">This ticket is a valid document that confirms your right to travel from the point of departure to the destination indicated on the ticket. When presenting this ticket to the driver, the passenger in whose name the ticket was purchased is entitled to travel. The ticket is valid for the entire trip. Thank you for choosing <span style="font-size: 14px; font-weight: 400; color:#2356ff;">Bustravel!</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `
      });

      console.log(`Email with ticket sent to ${to}`);
    } catch (error) {
      console.error(`Error sending ticket email: ${error.message}`);
      throw new Error('Error sending ticket email');
    }
  }
}

module.exports = new TicketService();
