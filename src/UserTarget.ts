import { ObjectId } from "mongodb";

export interface UserTarger {
    _id?: ObjectId,
    userId: string,
    targetItem: ObjectId,
    previousItem?: ObjectId,
    page?: number
}