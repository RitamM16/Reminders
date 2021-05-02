import { QueueScheduler, Worker } from "bullmq";
import { scheduleJob } from "./Scheduler";

export interface reminderJob {
    id: string
    time: string
    updatedAt: string
}

const QUEUE_NAME = "reminders";

let REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";

if(typeof(REDIS_PORT) === "string") REDIS_PORT = parseInt(REDIS_PORT);

export function startWorker(){
    //Worker listening for new reminder jobs
    const worker = new Worker(QUEUE_NAME, async job => {
        await scheduleJob(job.data)
    },{
        //@ts-ignore
        connection: {port: REDIS_PORT, host: REDIS_HOST}
    })

    //@ts-ignore
    const queueSchduler = new QueueScheduler(QUEUE_NAME,{connection: {port: REDIS_PORT, host: REDIS_HOST}});

    return [worker, queueSchduler];
}