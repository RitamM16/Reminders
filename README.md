# Reminders
A simple app that reminds you of your important events

The server is divided into 4 services, namely the `API server`, `Job Loader`, `Worker(s)`, `Push Notifier`. The API receives the REST API requests and saves the reminders to the database. The `JOB Loader` queries the database at every fixed interval of time and gets the reminders that are incomplete and have a time between the time of query and the next interval at which query will again be made. Then it uses `BullMQ` to queue the reminders for further scheduling. The `Worker` is the service that is responsible for taking the reminders from the queue and schedule them for mailing, there can be multiple `Workers` running at the same time working on the same queue. Here `node-schedule` is used to schedule the reminders, when the time of mailing is reached, `node-mailer` sends the mail to the recipient and also the reminder is queued for notification at the same time on a separate queue.  The `Push Notifier` is the service that provides the WebSocket layer using `Socket.io` for providing push notifications to a front end solution, its consumes the queue that the workers are filling on every occurrence of reminder being completed.

1. ## **The API Server**

   This service is responsible for handing REST API requests for the following functions and also any immediate queueing of reminders.

   1. **Sign up** `POST`

      - URL: `http://localhost:3000/signup`

      - Header: 

        - `Content-Type: application/json`

      - Body: `JSON`

        ```json
        {
            "email": "someemail@shouldwork.com",
            "name": "Just A Test Name",
            "password": "very very secret"
        }
        ```

      - Response: `JSON`

        ```json
        {
            "data": null,
            "error": false,
            "message": "Signed up Successfully..."
        }
        ```

      

   2. **Login** `POST`

      - URL: `http://localhost/3000/login`

      - Header:

        - `Content-Type: application/json`

      - Body: `JSON`

        ```json
        {
            "email": "someemail@shouldwork.com",
            "password": "very very secret"
        }
        ```

      - Response: `JSON`

        ```json
        {
        	"data": {
                "id": 1,
                "email": "someemail@shouldwork.com",
                "name": "Just A Test Name",
                "token": "<TOKEN>"
            },
            "error": false,
            "message": "Logged In Successfully..."
        }
        ```

      

   3. **Create Reminder** `POST`

      - URL: `http://localhost:3000/create-reminder`

      - Header:

        - `Content-Type: application/json`
        - `Authorization: Bearer <TOKEN>`

      - Body: `JSON`

        ```json
        {
            "name": "Meeting",
            "desc": "Evening meeting",
            "onTime": "5/2/2021, 6:27:11 pm", /*Any standard UTC datestring*/
            "email": "someemail@shouldwork.com",
            "is_recurring": "day"
        }
        ```

      - Response: `JSON`

        ```json
        {
        	"data": {
                "id": "<reminder id>"
            },
            "error": false,
            "message": "Reminder Created Succesfully..."
        }
        ```

      

   4. **Update Reminder** `POST`

      - URL: `http://localhost:3000/update-reminder`

      - Header:

        - `Content-Type: application/json`
        - `Authorization: Bearer <TOKEN>`

      - Body: `JSON`

        ```json
        {
            "id": "<reminder id>",
            "name": "Meeting", /*Optional*/
            "desc": "Evening meeting", /*Optional*/
            "onTime": "2021-05-03T12:50:10.000Z", /*Optional*/
            "email": "someemail@shouldwork.com", /*Optional*/
            "is_recurring": "day" /*Optional*/
        }
        ```

      - Response: `JSON`

        ```json
        {
            "data": null,
            "error": false,
            "message": "Reminder Updated..."
        }
        ```

      

   5. **Delete Reminder** `DELETE`

      - URL: `http://localhost:3000/delete-reminder?id=<reminder id>`

      - Header:

        - `Authorization: Bearer <TOKEN>`

      - Body:  `None`

      - Response: `JSON`

        ```json
        {
            "data": null,
            "error": false,
            "message": "Reminder Deleted..."
        }
        ```

      

   6. **Get Reminder** `GET`

      - URL: `http://localhost:3000/get-reminders`

      - Header:

        - `Authorization: Bearer <TOKEN>`

      - Body: `None`

      - Response: `JSON`

        ```json
        {
            "data": {
            	"reminders": [
                    {
                        "id": "09d5d823-8325-44aa-b4d5-a5160f583760",
                        "user_id": 1,
                        "name": "test reminder",
                        "description": "For testing",
                        "scheduled_data_time": "2021-05-03T12:50:10.000Z",
                        "email_to_remind_on": "test@test.com",
                        "is_recurring": "day",
                        "completed": 0, /*0-not completed, 1-completed*/
                        "createAt": "2021-05-02T12:49:41.329Z",
                        "updatedAt": "2021-05-02T12:50:15.538Z"
                    }
                ]
            },
            "error": false,
            "message": "Obtained reminders successfully..."
        }
        ```

   

2. ## Job Loader

   The `JOB Loader` queries the database at every fixed interval of time and gets the reminders that are incomplete and have a timestamp between the time of the query and the next interval at which query will again be made. `BullMq` is used as a job queue, the obtained reminders are pushed on a `reminders` queue. The `BullMq` uses `Redis` as backbone for its operations. This `Redis` is also used to store the current 'Query Time'(Time at which query was made), so that other services can use it. The `Loader` also communicates with all the workers, and keeps track of their internal states (The reminders that are scheduled). If a worker goes down, the reminders that were supposed to be sent by them are re-queued by the loader and other workers pick them up. If the loader goes down, the workers re-hydrate the newly created loader with their states.

   

3. ## Worker

   The `Worker` is responsible for consuming the `reminders` queue and scheduling the reminders for mailing. The worker maintains a list of currently scheduled reminders for mailing and shares this with the `loader` for fault tolerance. During the process of mailing a reminder, the  reminder is also queued to a queue `push_notification`.

   

4. ## Push Notifier

   The `Push Notifier` is responsible for consuming the `push_notification` queue and sending it to the appropriate client using the websocket connection provided by `Socker.IO`.
   
   For connecting to the notifier, the auth token needs to be set in the handshake, refer to the following instruction
   
   ```js
   const io = require("socket.io-client"); /*Required client v4+*/
   
   const socket = io.connect("http://localhost:9000",{
       auth: {
           token: "123"
       }
   });
   ```
   
   The server only emits one event `reminder `on receiving a reminder in the `push_notification` queue
   
   ```js
   socket.on('reminder', reminder => {
   	console.log(reminder);
       /*
       {
       	"id": "<reminder id>",
           "name": "Meeting",
           "desc": "Evening meeting",
           "time": "2021-05-03T12:50:10.000Z",
           "email": "someemail@shouldwork.com",
           "user_id": 1
           "is_recurring": "day"
       }
       */
   })
   ```
   
   

# Installation Instructions

1. **Pre-requisites**

   1. Should have NodeJS v10.19.0 or above installed.
   2.  Should have NPM v6.14.4 or above installed.
   3. Should have Redis 5 or above installed.
   4. Should have PostgreSQL 13 or above installed.
   5. Optional - Can use Nodemailer APP as an SMTP server.

2. **Steps**

   1. Install dependencies

      ```shell
      npm install
      ```

   2. Compile source code

      ```shell
      npm run build
      ```

   3. Configure the .env file

      ```
      DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/reminders?schema=public"
      
      #Redis
      REDIS_HOST="localhost"
      REDIS_PORT=6379
      
      #API SERVER
      PORT=3000
      
      #JOB LOADER
      #Time after which the cronjob repeats
      # Valid time default-1min 5min 30min 1hour
      CRONJOB_TIME="1min"
      
      #SOCKET.IO
      PUSH_NOTIFIER=9000
      LOADER_WORKER=8000
      
      #SMTP variables
      SMTP_HOST="localhost"
      SMTP_PORT=1025
      STMP_USERNAME="project.1"
      STMP_PASSWORD="secret.1"
      ```

   4. Initialize database and prisma client

      ```shell
      npm run config-database
      ```

3. **Running steps**

   Each of the 4 service needs to be ran separately, but should able to communicated with the dependencies.

   1. The API server, need connection to the `Redis` and `PostGreSQL`

      ```shell
      npm run start:server
      ```

   2. The Loader, needs connection to the `Redis` and `PostGreSQL`

      ```shell
      npm run start:loader
      ```

   3. The Worker, needs connection to the `Redis`, `Loader` and `PostGreSQL`

      ```shell
      npm run start:worker
      ```

   4. The Push Notifier, needs connection to the `Redis` only

      ```shell
      npm run start:push-notifier
      ```

      