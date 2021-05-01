import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";


/**
 * Using the nodemailer app as SMTP server for testing,
 * But any other publically available or privately owned
 * service will also work
 * */
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
    auth: {
        user: 'project.1',
        pass: 'secret.1'
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