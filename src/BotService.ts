import { Item, StoredTypes } from "./IItems";
import { InlineKeyboardButton, InlineKeyboardMarkup } from "node-telegram-bot-api";
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

    public async renderItemKeyboard (item: Item, offset?: number): Promise<InlineKeyboardMarkup> {
        if (item.type == StoredTypes.FOLDER) {
            offset = offset? offset : 0;
            const folderItems = await this.dbClient.getFolderItems(item, offset);
            let keyboard: Array<Array<InlineKeyboardButton>> = [];
            for (let i = 0; i < this.keyboardRows; i++) {
                keyboard.push([]);
                for (let j = 0; j < this.keyboardItemsInRow; j ++) {
                    keyboard[i].push({ text: folderItems[i + j].title, callback_data: folderItems[i + j]._id.toString()})
                }
            }
            return {inline_keyboard: keyboard};
        } else {
            return {inline_keyboard: [[{text: "123", callback_data: item._id.toString()}]]};
        }
    }

    public renderItemMesssageBody (item: Item) {

    }
}