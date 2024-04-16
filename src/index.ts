import options from "../conf/options"
import TelegramBot, {Message} from "node-telegram-bot-api"
import { App } from "./App";


const bot = new TelegramBot(options.bot.token, {polling: true});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "HEllo")
});