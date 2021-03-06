import date from 'date-and-time';
import {PrismaClient} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Gets all the reminders from the database that is within
 * the given time frame
 * @param time Time in min
 */
export async function getAllTheJobsWithInGiveTime(time: number) {
    const now = new Date()
    const timestamp = date.addMinutes(now, time);
    return prisma.reminder.findMany({
        where: {
            AND: [
                {
                    scheduled_data_time:{
                        lte: timestamp
                    }
                },
                {
                    scheduled_data_time: {
                        gt: now
                    }
                },
                {
                    completed:0
                }
            ]
        },
        orderBy: {
            scheduled_data_time: 'asc'
        }
    })
}

export async function getReminderDetailsOfAllTheGivenId(ids: string[]){
    return prisma.reminder.findMany({
        where: {
            id: {
                in: ids
            }
        }
    })
}
