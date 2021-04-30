import { PrismaClient } from "@prisma/client";
import {Express, Request, Response} from "express";
import { authRoutes } from "./auth";
import { ParamsDictionary,Query as ParsedQs } from "express-serve-static-core";
import { reminder } from "./reminder";

export const prisma = new PrismaClient();


export interface responseStruct {
    error: boolean,
    message: string,
    data: Object | null
}

//Function Defination for wrapper function over Express.RequestHandler
interface ExpressReqRes {
    (req: Request<ParamsDictionary, any, any, ParsedQs>, res: Response<any>, responseObj: responseStruct): void
}

/**
 * Express post Handler with Error Handler and Json Parser
 * @param path route that the server is listening for
 * @param callback Function
 */
 export function appPost(app:Express, path: string, callback: ExpressReqRes){
    
    app.post(path,async (req,res) => {

        const responseObj = createResponseObject();

        try {
            await callback(req,res,responseObj);
        } catch (error) {
            responseObj.error = true;
            responseObj.message = error.message;
        } finally {
            res.json(responseObj);
        }
    });
}

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

    reminder(app);

}