import { Server } from "socket.io";
import { verifyJWT } from "../utils/AuthUtils";
import { Worker } from "bullmq";

let SOCKET_PORT:any = process.env.PUSH_NOTIFIER || 9000;
SOCKET_PORT = typeof(SOCKET_PORT) === "string" ? parseInt(SOCKET_PORT) : SOCKET_PORT;

const io = new Server(SOCKET_PORT);

console.log("Push notifier is running on port",SOCKET_PORT);

//Map to store socket user mapping
const socket_user_mapping:{[id:string]: string} = {}

io.on('connection', async socket => {

    //Get the authentication header
    const authHeader = socket.handshake.auth["token"] as string;

    console.log("token", authHeader)

    if(!authHeader) socket.disconnect();

    let result;

    try{
        //Verify the token
        result = await verifyJWT(authHeader);
        if(result) socket_user_mapping[result.id] = socket.id;
    }catch(err){
        socket.disconnect();
    }

})

//Worker for listening for new push notifications
const worker = new Worker("push_notification",async job => {
    const socket_id = socket_user_mapping[job.data.id];
    console.log("Notification recieved:",job.data)
    if(socket_id) 
        io.to(socket_id).emit("reminder",job.data)
})