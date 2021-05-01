import { Server } from "socket.io";
import { verifyJWT } from "../utils/AuthUtils";
import { Worker } from "bullmq";

const io = new Server(9000);

//Map to store socket user mapping
const socket_user_mapping:{[id:string]: string} = {}

io.on('connection', async socket => {
    
    //Get the authentication header
    const authHeader = socket.handshake.headers['authorization'] as string;

    if(!authHeader) socket.disconnect();

    let result;

    try{
        //Verify the token
        result = await verifyJWT(authHeader);
    }catch(err){
        socket.disconnect();
    }

    if(result) socket_user_mapping[result.id] = socket.id;

})

//Worker for listening for new push notifications
const worker = new Worker("push_notification",async job => {
    const socket_id = socket_user_mapping[job.data.id];

    if(socket_id) 
        io.to(socket_id).emit("reminder",job.data)
})