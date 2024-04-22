import options from "../conf/options"
import TelegramBot, {Message, ParseMode, InlineKeyboardMarkup} from "node-telegram-bot-api"
import { MongoDbClient } from "./MongoClient";
import { BotService } from "./BotService";
import { isItem } from "./IItems";

const bot = new TelegramBot(options.bot.token, {polling: true});
const mdb = new MongoDbClient();
const botService = new BotService(mdb);
mdb.init().then(() => {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const mainFolder = await mdb.getMainFolder();
        bot.sendMessage( 
            chatId,
            await botService.renderItemMesssageBody(mainFolder, 0),
            await botService.getOptionsForItem(mainFolder) );
        await mdb.storeUserInfo(chatId.toString(), mainFolder, mainFolder, 0);
    });

    bot.on('callback_query', async (callback) => {
        if (! callback.data) return;
        if (! callback.message) return;
        const callbackData = callback.data;
        const msg = callback.message;
        const chatId = msg.chat.id;
        const userTarget = await mdb.getUserInfo(chatId.toString());
        if (!userTarget) return;
        //Pages handling
        if (callbackData == "prevPage" || callbackData == "nextPage") {
            
            const targetItem = await mdb.getItemByUri(userTarget.targetItem.toString());
            if (callbackData == "nextPage") {
                const itemPage = userTarget.page ? userTarget.page + 1 : 1;
                try {
                    //TODO: refactor that shit
                    await bot.editMessageText(
                        await botService.renderItemMesssageBody(targetItem, itemPage),
                        await botService.getOptionsForEditItem(chatId, msg.message_id ,targetItem, itemPage)
                    );
                    await mdb.storeUserInfo(chatId.toString(), targetItem, targetItem, itemPage);
                    return;
                } catch (error: any) {
                    console.log(error.message)
                    await bot.deleteMessage(chatId, msg.message_id);
                    const mainFolder = await mdb.getMainFolder();
                    bot.sendMessage( 
                        chatId,
                        await botService.renderItemMesssageBody(mainFolder, 0),
                        await botService.getOptionsForItem(mainFolder) );
                    await mdb.storeUserInfo(chatId.toString(), mainFolder, mainFolder, 0);
                }
            }
            if (callbackData == "prevPage") {
                const itemPage = userTarget.page ? userTarget.page - 1 : 0;
                try {
                    //TODO: refactor that shit
                    await bot.editMessageText( 
                        await botService.renderItemMesssageBody(targetItem, itemPage),
                        await botService.getOptionsForEditItem(chatId, msg.message_id ,targetItem, itemPage)
                    );
                    await mdb.storeUserInfo(chatId.toString(), targetItem, targetItem, itemPage);
                    return;
                } catch (error: any) {
                    console.log(error.message)
                    await bot.deleteMessage(chatId, msg.message_id);
                    const mainFolder = await mdb.getMainFolder();
                    bot.sendMessage( 
                        chatId,
                        await botService.renderItemMesssageBody(mainFolder, 0),
                        await botService.getOptionsForItem(mainFolder) );
                    await mdb.storeUserInfo(chatId.toString(), mainFolder, mainFolder, 0);
                }
            }
        }
        if (callbackData == "back") {
            const userTarget = await mdb.getUserInfo(chatId.toString());
            if (!userTarget) return;
            if (!userTarget.previousItem) {
                console.log("Cannot find prev item");
                await bot.deleteMessage(chatId, msg.message_id);
                const mainFolder = await mdb.getMainFolder();
                bot.sendMessage(
                    chatId,
                    await botService.renderItemMesssageBody(mainFolder, 0),
                    await botService.getOptionsForItem(mainFolder) );
                await mdb.storeUserInfo(chatId.toString(), mainFolder, mainFolder, 0);
            }
            const currentItem = await mdb.getItemByUri(userTarget.targetItem.toString());
            const previousItem = await mdb.getItemByUri(userTarget.previousItem.toString());
            //TODO: change this, need to store previous page (but if tree is big it doesnt work)
            const page = 0;
            try {
                await bot.editMessageText(
                    await botService.renderItemMesssageBody(previousItem, page),
                    await botService.getOptionsForEditItem(chatId, msg.message_id ,previousItem, page)
                );
                await mdb.storeUserInfo(chatId.toString(), previousItem, currentItem, page);
                return;
            } catch (error: any) {
                console.log(error.message)
                await bot.deleteMessage(chatId, msg.message_id);
                const mainFolder = await mdb.getMainFolder();
                bot.sendMessage( 
                    chatId,
                    await botService.renderItemMesssageBody(mainFolder, 0),
                    await botService.getOptionsForItem(mainFolder) );
                await mdb.storeUserInfo(chatId.toString(), mainFolder, mainFolder, 0);
                return;
            }   
        }

        const targetItem = await mdb.getItemByUri(userTarget.targetItem.toString());
        const jumpInItem = await mdb.getItemByUri(callbackData);
        await bot.editMessageText(
            await botService.renderItemMesssageBody(callbackData),
            await botService.getOptionsForEditItem(chatId, msg.message_id ,jumpInItem, 0)
        );
        await mdb.storeUserInfo(chatId.toString(), jumpInItem, targetItem, 0);
        return;
    })
})
