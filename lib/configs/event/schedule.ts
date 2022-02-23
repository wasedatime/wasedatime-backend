import * as events from 'aws-cdk-lib/aws-events';

export const syllabusSchedule: { [name: string]: events.Schedule } = {
  'regular':
    events.Schedule.cron({ minute: '0', hour: '16', day: '1', month: '*', year: '*' }),
  'fall-pre':
    events.Schedule.cron({ minute: '0', hour: '16', day: '19,21,23', month: 'JUL,AUG', year: '*' }),
  'fall-reg1':
    events.Schedule.cron({ minute: '0', hour: '16', day: '4,7,10,13,15,17', month: 'SEP', year: '*' }),
  'fall-reg2':
    events.Schedule.cron({ minute: '0', hour: '16', day: '20,23,25', month: 'SEP', year: '*' }),
  'fall-reg3':
    events.Schedule.cron({ minute: '0', hour: '16', day: '28,30', month: 'SEP', year: '*' }),
  'fall-reg4':
    events.Schedule.cron({ minute: '0', hour: '16', day: '3,5,8', month: 'OCT', year: '*' }),
  'spring-pre':
    events.Schedule.cron({ minute: '0', hour: '16', day: '14,24', month: 'FEB', year: '*' }),
  'spring-reg1':
    events.Schedule.cron({ minute: '0', hour: '16', day: '4,7,10,13,16,18,21,24,27', month: 'MAR', year: '*' }),
  'spring-reg2':
    events.Schedule.cron({ minute: '0', hour: '16', day: '3,5,8', month: 'APR', year: '*' }),
  'spring-reg3':
    events.Schedule.cron({ minute: '0', hour: '16', day: '16,20,24,26,28', month: 'APR', year: '*' }),
  'spring-reg4':
    events.Schedule.cron({ minute: '0', hour: '16', day: '9,12,14,16', month: 'MAY', year: '*' }),
};
