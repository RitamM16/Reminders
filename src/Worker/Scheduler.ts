import schedule from "node-schedule";
import date from "date-and-time";
import { reminderJob } from "./BullWorker";

export async function scheduleJob(reminder: reminderJob) {

    const time = date.addMinutes(new Date(reminder.time),-5)

    console.log("registered for",reminder)

    const job = schedule.scheduleJob(time,function(remainder: reminderJob) {
        //Send Email
        console.log("sending email",reminder)
    }.bind(null, reminder))
    return job;
}