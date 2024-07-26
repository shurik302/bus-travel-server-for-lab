const nodeMailer = require("nodemailer");
require('dotenv').config();

class MailService {
  constructor() {
    this.transporter = nodeMailer.createTransport({
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

  async sendActivationMail(to, activationLink) {
    if (!to) {
      console.error("Адреса електронної пошти отримувача не вказана");
      throw new Error('Адреса електронної пошти отримувача не вказана');
    }

    if (!this.validateEmail(to)) {
      console.error(`Некоректний формат адреси електронної пошти отримувача: ${to}`);
      throw new Error('Некоректний формат адреси електронної пошти отримувача');
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: to,
        subject: `Активація акаунту на сайті ${process.env.API_URL}`,
        text: "",
        html: `<div style="font-family: 'Open Sans', sans-serif;">
          <div style="text-align: center; padding: 20px; background-color: #1e92ff;">
            <a href="data:image/png;base64,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">
              <img=/>
            </a>
          </div>
          <div style="text-align: center; padding: 40px 20px;">
            <h1 style="font-size: 32px; color: black; font-weight: 400;">Для активації акаунту, натисніть на посилання нижче</h1>
            <a href="${activationLink}" style="font-size: 20px; text-decoration: none; color: white; background-color: #1e92ff; border-radius: 8px; padding: 10px 25px; display: inline-block; margin-top: 30px; transition: background-color 0.5s;">активувати акаунт</a>
          </div>
        </div>`
      });

      console.log(`Лист з активацією відправлено на ${to}`);
    } catch (error) {
      console.error(`Помилка при відправленні листа активації: ${error.message}`);
      throw new Error('Помилка при відправленні листа активації');
    }
  }
}

module.exports = new MailService();
