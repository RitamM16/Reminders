import { Queue } from "bullmq";
import schedule from "node-schedule";
import { getAllTheJobsWithInGiveTime } from "./utils";

const every5sec = "*/5 * * * * *";

const every1min = "*/1 * * * *";

const remindersQueue = new Queue('reminders');

//Schedule a cron job to run every 1 min
export async function scheduleCronJob(){
    schedule.scheduleJob(every5sec, async () => {
        console.log("Its working");
    
        const reminders = await getAllTheJobsWithInGiveTime(24);
    
        await remindersQueue.addBulk(reminders.map(reminder => {
            return {
                name: reminder.id,
                data: {
                    name: reminder.name,
                    email: reminder.email_to_remind_on,
                    time: reminder.scheduled_data_time
                }
            }
        }))

        console.log("Job Scheduled at:", new Date())
    })
}