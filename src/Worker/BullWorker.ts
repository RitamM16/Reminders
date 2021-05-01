import { Worker } from "bullmq";
import { scheduleJob } from "./Scheduler";

export interface reminderJob {
    id: string
    time: string
    updatedAt: string
}

const QUEUE_NAME = "reminders";

export function startWorker(){
    //Worker listening for new reminder jobs
    return new Worker(QUEUE_NAME, async job => {
        scheduleJob(job.data)
    })
}