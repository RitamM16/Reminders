import io, { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io-client/build/typed-events";

const PORT = process.env.LOADER_WORKER || 8000;

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

let state: {id: string, time: string}[] = [];

export const addNewReminder = (id: string, time: string) => {

    if(state.find(reminder => reminder.time === time)) return true;

    state.push({id,time});
    socket.emit("new_reminder",{id,time});

    return false;
}

export const removeReminder = (id:string,time:string) => {
    state = state.filter(reminder => reminder.id !== id && reminder.time !== time);
    socket.emit("reminder_done",{id,time});
}

export function connectToSocketServer(){
    socket = io("http://localhost:"+PORT);

    socket.on("send_existing_reminders", () => {
        if(state.length != 0)
            socket.emit("existing_reminders", state);
    })
}