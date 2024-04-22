import { ObjectId } from "mongodb";

export interface UserTarger {
    userId: string,
    targetItem: ObjectId,
    previousItem: ObjectId,
    page?: number
}