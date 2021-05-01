import express from 'express';
import { rootRoute } from './routes/root';

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

//Initializes all the routes
rootRoute(app)

app.listen(PORT,() => {
    console.log("Server Listening on port:",PORT)
})