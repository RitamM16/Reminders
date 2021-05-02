import { startWorker } from "./BullWorker";
import { connectToSocketServer } from "./Socket";

connectToSocketServer();
const [worker, queueScheduler] = startWorker();

console.log("The worker is working!")