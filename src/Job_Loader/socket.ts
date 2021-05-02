import { Server } from "socket.io";
import { remindersQueue } from "./cron_job";
import { getReminderDetailsOfAllTheGivenId } from "./utils";

let SOCKET_PORT:any = process.env.LOADER_WORKER || 8000;
SOCKET_PORT = typeof(SOCKET_PORT) === "string" ? parseInt(SOCKET_PORT) : SOCKET_PORT;

const state:{[id:string]:string[]} = {};

let io;

const addNewReminderId = (workerid: string, reminderid: string) => {
    if(!state[workerid]){
        state[workerid] = [];
    }

    state[workerid].push(reminderid);
}

const addExistingReminders = (workerid: string, reminderids: string[]) => {
    state[workerid] = reminderids;
}

const removeReminderId = (workerid: string, reminderid: string) => {
    state[workerid] = state[workerid].filter(id => id !== reminderid)
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
    
        socket.on("existing_reminders", (reminders) => {
            addExistingReminders(id,reminders)
            console.log("state:",state)
        })
    
        //Recording new reminder is been scheduled
        socket.on("new_reminder",(reminderid) => {
            addNewReminderId(id, reminderid);
            console.log("state:",state)
        })  
    
        //Removing the id as its already sent
        socket.on("reminder_done", (reminderid) => {
            removeReminderId(id,reminderid);
            console.log("state:",state)
        })
        
        socket.on("disconnect",async () => {
    
            console.log("disconnected")

            const ids = getAndRemoveReminderId(id);
    
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

