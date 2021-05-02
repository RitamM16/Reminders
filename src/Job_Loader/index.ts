import {scheduleCronJob} from "./cron_job"
import { startSocketServer } from "./socket"

startSocketServer();
scheduleCronJob()
console.log("Job Scheduler started!!")


