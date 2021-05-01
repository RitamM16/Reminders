import { Queue } from "bullmq";
import schedule from "node-schedule";
import { getAllTheJobsWithInGiveTime } from "./utils";
import date from "date-and-time";
import ioredis from "ioredis";

const redis = new ioredis(6379,"localhost");

const every5sec = "*/5 * * * * *";

const every1min = "*/1 * * * *";

const every30min = "0 */1 * * *";

const remindersQueue = new Queue('reminders');

//Schedule a cron job to run every 1 min
export async function scheduleCronJob(){
    
    schedule.scheduleJob(every30min, async () => {

        const next_time = date.addMinutes(new Date(), 30).toUTCString();

        await redis.set("state:update_time",next_time);

        const reminders = await getAllTheJobsWithInGiveTime(1);

        if(reminders.length === 0) return;
    
        await remindersQueue.addBulk(reminders.map(reminder => {
            return {
                name: reminder.id,
                data: {
                    id: reminder.id,
                    time: reminder.scheduled_data_time,
                    updateAt: reminder.updatedAt
                }
            }
        }))

        console.log("Job Scheduled at:", new Date())
    })
}