import { Express } from "express";
import { checkAuthToken, verifyJWT } from "../../utils/AuthUtils";
import {appDelete, appGet, appPost, prisma} from "./root";
import {v4 as uuid4} from "uuid";
import ioredis from "ioredis";
import { Queue } from "bullmq";


let REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

if(typeof(REDIS_PORT) === "string") REDIS_PORT = parseInt(REDIS_PORT);
const redis = new ioredis(REDIS_PORT,"localhost");
const queue = new Queue("reminders",{connection:redis});

export const reminder = (app: Express) => {
    
    appPost(app,'/create-reminder', async (req,res,resObj) => {
        
        //Check the Bearer Token
        const result = checkAuthToken(req.headers.authorization);

        const name = req.body["name"];
        const desc = req.body['desc'];
        const onTime = req.body['onTime'];
        const email = req.body['email'];
        const is_recurring = req.body['is_recurring'];//no, day, week, month, year

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

        const [update_time, reminder] = await Promise.all([
            redis.get("state:update_time"),
            prisma.reminder.create({
                data: {
                    id: uuid4(),
                    name: name,
                    email_to_remind_on: email,
                    scheduled_data_time: new Date(onTime),
                    description: desc,
                    is_recurring: is_recurring,
                    user_id: parseInt(result.id)
                }
            })
        ])

        //Schedule the reminder immediately as the schedule loop has already been done for the time range
        if(update_time && new Date(update_time).getTime() > new Date(onTime).getTime()){
            queue.add(reminder.id,{
                id: reminder.id,
                time: reminder.scheduled_data_time,
                updateAt: reminder.updatedAt
            })
        }

        resObj.message = "Reminder Created Succesfully...";
        resObj.data = {
            id: reminder.id
        }
    })

    appPost(app, '/update-reminder',async (req,res,resObj) => {

        //check auth token
        checkAuthToken(req.headers.authorization);

        const id = req.body["id"];
        const name = req.body["name"];
        const desc = req.body['desc'];
        const onTime = req.body['onTime'];
        const email = req.body['email'];

        if(typeof(id) !== "string" && name === ""){
            throw Error("Id format Invalid");
        }

        const updateObject:{[id:string]:any} = {};

        if(typeof(name) === "string" && name !== ""){
            updateObject["name"] = name;
        }
        if(typeof(desc) === "string" && desc !== ""){
            updateObject["description"] = desc;
        }
        if(typeof(onTime) === "string" && onTime !== ""){
            updateObject["scheduled_data_time"] = new Date(onTime);
        }
        if(typeof(email) === "string" && email !== ""){
            updateObject["email_to_remind_on"] = email;
        }

        if(Object.keys(updateObject).length === 0){
            throw Error("No property to update...");
        }

        const [update_time, reminder] = await Promise.all([
            redis.get("state:update_time"), prisma.reminder.findUnique({where:{id}})
        ])

        if(!reminder) throw Error("Reminder not found!");

        if(onTime && update_time && new Date(update_time).getTime() > new Date(onTime).getTime()) {
            queue.add(reminder.id, {
                id: reminder.id,
                time: reminder.scheduled_data_time,
                updateAt: reminder.updatedAt
            })
        }

        await prisma.reminder.update({
            where: {id},
            data: updateObject
        })

        //TODO Check and update a job in queue
        resObj.message = "Reminder Updated...";

    })

    appDelete(app,'/delete-reminder', async (req,res,resObj) => {

        //Check auth token
        checkAuthToken(req.headers.authorization);

        const reminder_id = req.query["id"] as string

        if(typeof(reminder_id) !== "string" && reminder_id === ""){
            throw Error("Id format Invalid");
        }

        //TODO remove the reminder from queue

        const reminder = await prisma.reminder.delete({
            where: {id: reminder_id}
        })

        resObj.message = "Reminder Deleted..."
        
    })

    appGet(app,'/get-reminders', async (req,res,resObj) => {

        //Check auth token
        const result = checkAuthToken(req.headers.authorization);

        const reminders = await prisma.reminder.findMany({where: {user_id: parseInt(result.id)}});

        resObj.message = "Obtained reminders successfully...";

        resObj.data = { reminders }

    })
}