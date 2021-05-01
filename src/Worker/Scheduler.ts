import schedule from "node-schedule";
import dateTime from "date-and-time";
import { reminderJob } from "./BullWorker";
import { sendMail } from "./Mail/config";
import { PrismaClient } from "@prisma/client";
import ioredis from "ioredis";
import { Queue } from "bullmq";

const redis = new ioredis(6379,"localhost");

const prisma = new PrismaClient();

const queue = new Queue("push_notification");

function formatDate(date: Date) {
    //const date = new Date(dateString);
    let fullDate = dateTime.format(date,"dddd, MMMM DD,Y ") + "at ";
    fullDate += dateTime.format(date, "hh:mm A")
    return fullDate;
}

export async function scheduleJob(reminder: reminderJob) {

    //A little time offset to balance any delay in starting and during its execution of the job
    const time = dateTime.addSeconds(new Date(reminder.time),5)

    const job = schedule.scheduleJob(time,async function(remainder: reminderJob) {

        //Check if the reminder is still valid
        const [freshReminder, NextUpdateTime] = await Promise.all([
            prisma.reminder.findUnique({where: {id: remainder.id}}),
            redis.get("state:update_time")
        ])

        //If deleted already then no need to 
        if(!freshReminder) return

        //If modified
        if(freshReminder.updatedAt.getTime() !== new Date(remainder.updatedAt).getTime()){
            
            //If new time is less than previoud time or scheduled time is greater the update time
            if(freshReminder.scheduled_data_time.getTime() < new Date(remainder.time).getTime() 
                || freshReminder.scheduled_data_time.getTime() > new Date(NextUpdateTime!).getTime()) {
                    return
                }
        } 

        await Promise.all([
            queue.add("new_reminder",{
                id: freshReminder.id,
                name: freshReminder.name,
                desc: freshReminder.description,
                email: freshReminder.email_to_remind_on,
                time: freshReminder.scheduled_data_time,
                is_recurring: freshReminder.is_recurring
            }),
            sendMail(
                freshReminder.name,
                freshReminder.description,
                formatDate(freshReminder.scheduled_data_time),
                freshReminder.email_to_remind_on
            )
        ])

        if(freshReminder.is_recurring !== "no"){
            let time;
            if(freshReminder.is_recurring === "day"){
                time = dateTime.addDays(freshReminder.scheduled_data_time,1);
            }
            if(freshReminder.is_recurring === "week"){
                time = dateTime.addDays(freshReminder.scheduled_data_time,7);
            }
            if(freshReminder.is_recurring === "month"){
                time = dateTime.addMonths(freshReminder.scheduled_data_time,1);
            }
            if(freshReminder.is_recurring === "year"){
                time = dateTime.addYears(freshReminder.scheduled_data_time,1);
            }
            await prisma.reminder.update({
                where: {id: freshReminder.id},
                data: {scheduled_data_time: time}
            })
        }else{
            await prisma.reminder.update({
                where: {id:freshReminder.id},
                data: {completed: 1}
            })
        }
 
    }.bind(null, reminder))
    return job;
}

