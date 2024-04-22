import { isItem, Item, StoredTypes } from "./IItems";
import { InlineKeyboardButton, InlineKeyboardMarkup, Chat, SendMessageOptions, EditMessageTextOptions } from "node-telegram-bot-api";
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

    public async renderItemKeyboard (item: Item | string, page?: number): Promise<InlineKeyboardMarkup> {
        if (! isItem(item)) {
            item = await this.dbClient.getItemByUri(item)
        }
        if (item.type == StoredTypes.FOLDER) {
            page = page? page : 0;
            const folderItems = await this.dbClient.getFolderItems(item, page * this.keyboardItemsInRow * this.keyboardRows);
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
    
    public async getKeyboardForFolder(item: Item, page?: number): Promise<InlineKeyboardMarkup> {
        let keyboard = await this.renderItemKeyboard(item, page);
        keyboard.inline_keyboard.push([
            {text: "<-", callback_data: "prevPage"},
            {text: "Назад", callback_data: "back"},
            {text: "->", callback_data: "nextPage"},
        ]);
        return keyboard;
    }

    public getKeyboardForItem(): InlineKeyboardMarkup {
        return {
            inline_keyboard:
            [[{text: "Назад", callback_data: "back"}]]
        }
    }    

    public async renderItemMesssageBody (item: Item | string, page?: number) {
        page = page? page : 0;
        if (! isItem(item)) {
            item = await this.dbClient.getItemByUri(item)
        }
        if (item.type == StoredTypes.ITEM) {
            return `<a href="${item.hasItem}">${item.title}</a>`
        } else {
            return `<b>${item.title}</b> page: ${page}`
        }
    }

    public async getOptionsForItem(item: Item | string, page?: number): Promise<SendMessageOptions> {
        if (! isItem(item)) {
            item = await this.dbClient.getItemByUri(item)
        }
        if (item.type == StoredTypes.ITEM) {
            return {
                parse_mode: "HTML",
                reply_markup: this.getKeyboardForItem()
            }
        }
        return {
            parse_mode: "HTML",
            reply_markup: await this.getKeyboardForFolder(item, page)
        }
    }

    public async getOptionsForEditItem(chatId: number, messageId: number, item: Item, page: number): Promise<EditMessageTextOptions> {
        let opts = await this.getOptionsForItem(item, page) as EditMessageTextOptions;
        opts.chat_id = chatId;
        opts.message_id = messageId;
        return opts;
    }
}