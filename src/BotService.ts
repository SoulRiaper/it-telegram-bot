import { isItem, Item, StoredTypes } from "./IItems";
import { InlineKeyboardButton, InlineKeyboardMarkup, Chat } from "node-telegram-bot-api";
import { MongoDbClient } from "./MongoClient";


export class BotService {
    keyboardRows: number;
    keyboardItemsInRow: number;
    private dbClient: MongoDbClient;
    
    constructor (dbClient: MongoDbClient) {
        this.keyboardRows = 4;
        this.keyboardItemsInRow = 1;
        this.dbClient = dbClient;
    }

    public async renderItemKeyboard (item: Item | string, offset?: number): Promise<InlineKeyboardMarkup> {
        if (! isItem(item)) {
            item = await this.dbClient.getItemByUri(item)
        }
        if (item.type == StoredTypes.FOLDER) {
            offset = offset? offset : 0;
            const folderItems = await this.dbClient.getFolderItems(item, offset);
            let keyboard: Array<Array<InlineKeyboardButton>> = [];
            for (let i = 0; i < this.keyboardRows; i++) {
                keyboard.push([]);
                for (let j = 0; j < this.keyboardItemsInRow; j ++) {
                    if (! folderItems[i + j]) break;
                    keyboard[i].push({ text: folderItems[i + j].title, callback_data: folderItems[i + j]._id.toString()})
                }
                if (! folderItems[i * this.keyboardItemsInRow]) break;
            }
            return {inline_keyboard: keyboard};
        }
        return {inline_keyboard: [[]]};
    }

    public async renderItemMesssageBody (item: Item | string) {
        if (! isItem(item)) {
            item = await this.dbClient.getItemByUri(item)
        }
        if (item.type == StoredTypes.ITEM) {
            return `<a href="${item.hasItem}">${item.title}</a>`
        } else {
            return `<b>${item.title}</b>`
        }
    }

    public async renderMessageForItem(chatId: Chat , item: Item | string) {
        if (! isItem(item)) {
            item = await this.dbClient.getItemByUri(item)
        }
        return {
            chatId,
            text: await this.renderItemMesssageBody(item),
            options: {
                reply_markup: await this.renderItemKeyboard(item)
            }
        };
    }
}