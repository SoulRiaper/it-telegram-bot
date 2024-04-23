import { Collection, Db, MongoClient, ObjectId } from "mongodb";
import { Item, StoredTypes, isItem } from "./IItems";
import { UserTarger } from "./UserTarget";

export class MongoDbClient {
    private url: string;
    private client: MongoClient;
    private db!: Db;
    private mainCollection!: Collection<Item>;
    private userActions!: Collection<UserTarger>;

    constructor () {
        // TODO: load from options or system environment
        this.url = 'mongodb://mongodb:27017';
        this.client = new MongoClient(this.url);
    }

    public async init () {
        await this.client.connect();
        this.db = this.client.db("main");
        this.mainCollection = this.db.collection<Item>('user-things');
        this.userActions = this.db.collection<UserTarger>('user-actions');
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
                return await this.mainCollection.find({ _id: { $in: item.hasItem.slice(offset)}}).sort({type:1}).toArray();
            }
        }
        return [];
    }

    public async getItemByUri(uri: string): Promise<Item> {
        return (await this.mainCollection.findOne({ _id: new ObjectId(uri)})) as Item;
    }

    public async storeUserInfo(userId: string, targetItem: Item, previousItem: Item, page?: number) {
        const infoObj = await this.userActions.findOne({userId: userId});
        if (infoObj != null) {
            await this.userActions.updateOne({ _id: infoObj._id },     
            { $set: 
                {
                    previousItem: previousItem._id,
                    targetItem: targetItem._id,
                    page
                }
            });
        } else {
            await this.userActions.insertOne({ userId, targetItem: targetItem._id, previousItem: previousItem._id, page});
        }
    }

    public async getUserInfo(userId: string) {
        return await this.userActions.findOne({userId});
    }
}
