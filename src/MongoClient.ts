import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { Item, StoredTypes, isItem } from "./IItems";

export class MongoDbClient {
    private url: string;
    private client: MongoClient;
    private db!: Db;
    private mainCollection!: Collection<Item>;
    constructor () {
        // TODO: load from options or system environment
        this.url = 'mongodb://localhost:27017';
        this.client = new MongoClient(this.url);
    }

    public async init () {
        await this.client.connect();
        this.db = this.client.db("main");
        this.mainCollection = this.db.collection<Item>('user-things');
    }

    public async destruct () {
        await this.client.close();
    }

    public async getMainFolder () {
        return (await this.mainCollection.findOne({title: "MAIN"})) as Item;
    }

    public async getFolderItems (item: Item, offset: number): Promise<Item[]> {
        if (item.type == StoredTypes.FOLDER) {
            if (item.hasItem instanceof Array) {
                return await this.mainCollection.find({ _id: { $in: item.hasItem.slice(offset)}}).toArray();
            }
        }
        return [];
    }
}
