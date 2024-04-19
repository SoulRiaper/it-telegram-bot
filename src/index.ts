import options from "../conf/options"
import TelegramBot, {Message, ParseMode, InlineKeyboardMarkup} from "node-telegram-bot-api"
import { MongoDbClient } from "./MongoClient";
import { BotService } from "./BotService";

const bot = new TelegramBot(options.bot.token, {polling: true});
const mdb = new MongoDbClient();
const botService = new BotService(mdb);
mdb.init().then(() => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const mainFolder = await mdb.getMainFolder();
        bot.sendMessage(chatId, "Welcome to " + mainFolder.title, {reply_markup: await botService.renderItemKeyboard(mainFolder)})
    });
})
