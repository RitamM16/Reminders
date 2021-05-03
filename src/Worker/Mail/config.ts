import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

const HOST = process.env.SMTP_HOST || "localhost";
const PORT = process.env.SMTP_PORT || 1025;
const USER_NAME = process.env.STMP_USERNAME || "project.1";
const PASSWORD = process.env.STMP_PASSWORD || "secret.1";


/**
 * Using the nodemailer app as SMTP server for testing,
 * But any other publically available or privately owned
 * service will also work
 * */
const transporter = nodemailer.createTransport({
    host: HOST,
    //@ts-expect-error
    port: parseInt(PORT),
    auth: {
        user: USER_NAME,
        pass: PASSWORD
    }
});

//Open template file
const source = fs.readFileSync(path.join(__dirname,"../../../templates",'template.html'),'utf8');

//Create email generator
const template = handlebars.compile(source);

export async function sendMail(
    name: string,
    desc: string,
    time: string,
    to: string,
) {
    return transporter.sendMail({
        from: "official@reminders.com",
        to: to,
        subject: "Reminder",
        html: template({
            name,desc,time
        })
    })
}