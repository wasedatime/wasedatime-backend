import {Schedule} from "@aws-cdk/aws-events";


export const syllabusSchedule: { [name: string]: Schedule } = {

    REGULAR:
        Schedule.cron({minute: '0', hour: '16', day: '1', month: '*', year: '*'}),

    FALL_PRE:
        Schedule.cron({minute: '0', hour: '16', day: '19,21,23', month: 'JUL,AUG', year: '*'}),

    FALL_REG1:
        Schedule.cron({minute: '0', hour: '16', day: '4,7,10,13,15,17', month: 'SEP', year: '*'}),

    FALL_REG2:
        Schedule.cron({minute: '0', hour: '16', day: '20,23,25', month: 'SEP', year: '*'}),

    FALL_REG3:
        Schedule.cron({minute: '0', hour: '16', day: '28,30', month: 'SEP', year: '*'}),

    FALL_REG4:
        Schedule.cron({minute: '0', hour: '16', day: '3,5,8', month: 'OCT', year: '*'}),

    SPRING_PRE:
        Schedule.cron({minute: '0', hour: '16', day: '14,24', month: 'FEB', year: '*'}),

    SPRING_REG1:
        Schedule.cron({minute: '0', hour: '16', day: '4,7,10,13,16,18,21,24,27', month: 'MAR', year: '*'}),

    SPRING_REG2:
        Schedule.cron({minute: '0', hour: '16', day: '3,5,8', month: 'APR', year: '*'}),

    SPRING_REG3:
        Schedule.cron({minute: '0', hour: '16', day: '16,20,24,26,28', month: 'APR', year: '*'}),

    SPRING_REG4:
        Schedule.cron({minute: '0', hour: '16', day: '9,12,14,16', month: 'MAY', year: '*'})
};