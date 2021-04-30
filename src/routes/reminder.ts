import { Express } from "express";
import { checkAuthToken, verifyJWT } from "../utils/AuthUtils";
import {appPost, prisma} from "./root";
import {v4 as uuid4} from "uuid";

export const reminder = (app: Express) => {
    
    appPost(app,'/create-reminder', async (req,res,resObj) => {
        
        //Check the Bearer Token
        checkAuthToken(req.headers.authorization);

        const name = req.body["name"];
        const desc = req.body['desc'];
        const onTime = req.body['onTime'];
        const email = req.body['email'];

        if(typeof(name) !== "string" && name === ""){
            throw Error("Name format Invalid");
        }
        if(typeof(desc) !== "string" && desc === ""){
            throw Error("Description format Invalid");
        }
        if(typeof(onTime) !== "string" && onTime === ""){
            throw Error("Scheduled time format Invalid");
        }
        if(typeof(email) !== "string" && email === ""){
            throw Error("Email format Invalid");
        }

        const reminder = await prisma.reminder.create({
            data: {
                id: uuid4(),
                name: name,
                email_to_remind_on: email,
                scheduled_data_time: new Date(onTime),
                description: desc,
                is_recurring: 0
            }
        })

        resObj.message = "Reminder Created Succesfully...";
        resObj.data = {
            id: reminder.id
        }
    })

}