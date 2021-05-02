import { Queue } from "bullmq";
import schedule from "node-schedule";
import { getAllTheJobsWithInGiveTime } from "./utils";
import date from "date-and-time";
import ioredis from "ioredis";

let REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

//@ts-ignore
if(typeof(REDIS_HOST) === "string") REDIS_PORT = parseInt(REDIS_PORT);
//@ts-ignore
const redis = new ioredis(REDIS_PORT,"localhost");

const cron_time = process.env.CRONJOB_TIME || "30min";

const every5sec = "*/5 * * * * *";

const every1min = "*/1 * * * *";

const every5min = "*/5 * * * *";

const every30min = "*/30 * * * *";

const every1hour = "0 */1 * * *";

const schedule_time = {
    cron_string: every1min,
    time: 1
};

if(cron_time === "5min"){
    schedule_time.cron_string = every5min;
    schedule_time.time = 5;
}
if(cron_time === "30min"){
    schedule_time.cron_string = every30min;
    schedule_time.time = 30;
}
if(cron_time === "1hour"){
    schedule_time.cron_string = every1hour;
    schedule_time.time = 60;
}

export const remindersQueue = new Queue('reminders', { connection: redis });

//Schedule a cron job to run every 1 min
export async function scheduleCronJob(){
    
    schedule.scheduleJob(every5sec, async () => {

        const next_time = date.addMinutes(new Date(), schedule_time.time).toUTCString();

        await redis.set("state:update_time",next_time);

        const reminders = await getAllTheJobsWithInGiveTime(schedule_time.time);

        if(reminders.length === 0) return;
    
        await remindersQueue.addBulk(reminders.map(reminder => {
            return {
                name: reminder.id,
                data: {
                    id: reminder.id,
                    time: reminder.scheduled_data_time,
                    updateAt: reminder.updatedAt
                },
                opts: {
                    jobId: reminder.id
                }
                
            }
        }))

        console.log("Job Scheduled at:", new Date())
    })
}