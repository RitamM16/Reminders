import io, { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io-client/build/typed-events";

const PORT = process.env.LOADER_WORKER || 8000;

let socket: Socket<DefaultEventsMap, DefaultEventsMap>;

let state: string[] = [];

export const addNewReminder = (id: string) => {

    if(state.find(reminderid => reminderid === id)) return true;

    state.push(id);
    socket.emit("new_reminder",id);

    return false;
}

export const removeReminder = (id:string) => {
    state = state.filter(reminderId => reminderId !== id);
    socket.emit("reminder_done",id);
}

export function connectToSocketServer(){
    socket = io("http://localhost:"+PORT);

    socket.on("send_existing_reminders", () => {
        if(state.length != 0)
            socket.emit("existing_reminders", state);
    })
}