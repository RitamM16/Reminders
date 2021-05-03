import { Server } from "socket.io";
import { remindersQueue } from "./cron_job";
import { getReminderDetailsOfAllTheGivenId } from "./utils";

let SOCKET_PORT:any = process.env.LOADER_WORKER || 8000;
SOCKET_PORT = typeof(SOCKET_PORT) === "string" ? parseInt(SOCKET_PORT) : SOCKET_PORT;

const state:{[id:string]:{id: string, time: string}[]} = {};

let io;

const addNewReminderId = (workerid: string, reminder: {id: string, time: string}) => {
    if(!state[workerid]){
        state[workerid] = [];
    }

    state[workerid].push(reminder);
}

const addExistingReminders = (workerid: string, reminder: {id: string, time: string}[]) => {
    state[workerid] = reminder;
}

const removeReminderId = (workerid: string, reminder: {id: string, time: string}) => {
    state[workerid] = state[workerid].filter(r => r.id !== reminder.id && r.time!== reminder.time)
}

const getAndRemoveReminderId = (workerid: string) => {
    const ids = [...state[workerid]];
    state[workerid] = [];
    return ids;
}

export function startSocketServer(){
    io = new Server(SOCKET_PORT);

    io.on("connection", socket => {

        console.log("connected to client.");

        const id = socket.id
    
        socket.emit("send_existing_reminders");
    
        //Sends the existing reminders to the newly created loader, if the previous one goes down
        socket.on("existing_reminders", (reminders) => {
            addExistingReminders(id,reminders)
        })
    
        //Recording new reminder is been scheduled
        socket.on("new_reminder",(reminder) => {
            addNewReminderId(id, reminder);
        })  
    
        //Removing the id as its already sent
        socket.on("reminder_done", (reminder) => {
            removeReminderId(id,reminder);
        })
        
        socket.on("disconnect",async () => {
    
            console.log("disconnected")

            const ids = getAndRemoveReminderId(id).map(r => r.id);
    
            if(ids) {
                var reminders = await getReminderDetailsOfAllTheGivenId(ids);
    
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
            }
            
    
        })
    })
}

