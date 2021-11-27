import {Schedule} from "@aws-cdk/aws-events";

export const syllabusSchedule: { [name: string]: Schedule } = {
    'regular':
        Schedule.cron({minute: '0', hour: '16', day: '1', month: '*', year: '*'}),
    'fall-pre':
        Schedule.cron({minute: '0', hour: '16', day: '19,21,23', month: 'JUL,AUG', year: '*'}),
    'fall-reg1':
        Schedule.cron({minute: '0', hour: '16', day: '4,7,10,13,15,17', month: 'SEP', year: '*'}),
    'fall-reg2':
        Schedule.cron({minute: '0', hour: '16', day: '20,23,25', month: 'SEP', year: '*'}),
    'fall-reg3':
        Schedule.cron({minute: '0', hour: '16', day: '28,30', month: 'SEP', year: '*'}),
    'fall-reg4':
        Schedule.cron({minute: '0', hour: '16', day: '3,5,8', month: 'OCT', year: '*'}),
    'spring-pre':
        Schedule.cron({minute: '0', hour: '16', day: '14,24', month: 'FEB', year: '*'}),
    'spring-reg1':
        Schedule.cron({minute: '0', hour: '16', day: '4,7,10,13,16,18,21,24,27', month: 'MAR', year: '*'}),
    'spring-reg2':
        Schedule.cron({minute: '0', hour: '16', day: '3,5,8', month: 'APR', year: '*'}),
    'spring-reg3':
        Schedule.cron({minute: '0', hour: '16', day: '16,20,24,26,28', month: 'APR', year: '*'}),
    'spring-reg4':
        Schedule.cron({minute: '0', hour: '16', day: '9,12,14,16', month: 'MAY', year: '*'}),
};
