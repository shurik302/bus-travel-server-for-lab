const TelegramBot = require('node-telegram-bot-api');

const token = '6846979569:AAGo22T-1Qm-Z6L7cQWD6F8kq0Ic6B44Yqs';
const bot = new TelegramBot(token, { polling: true });

module.exports = bot;
