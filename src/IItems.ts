import { ObjectId } from "mongodb";

export interface LinkArray {
    [key : string]: Array<Item>
}

export interface Item {
    _id: ObjectId
    type: StoredTypes,
    title: string,
    searchOrigin: SearchOrigins,
    hasItem: string | Array<ObjectId>
}

export function isItem(item: any): item is Item {
    return 'type' in item;
}

export enum StoredTypes{
    FOLDER = "folder",
    ITEM = "item"
}

export enum SearchOrigins {
    LANG = "lang"
}