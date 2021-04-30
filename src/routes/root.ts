import { PrismaClient } from "@prisma/client";
import {Express} from "express";
import { authRoutes } from "./auth";

export const prisma = new PrismaClient();

/**
 * An response template for uniform response structure
 * @returns Response object
 */
export function createResponseObject() : {data: null | any, error: boolean, message: string} {
    return {
        data: null, error: false, message: ''
    }
}

/**
 * Initializes individual express routes of the server
 * @param app The Express app instance
 */
export const rootRoute = (app: Express) => {

    //Auth routes
    authRoutes(app);

}