const https = require('https');

exports.handler = async (event) => {
    const msg = event.Records[0].Sns.Message;
    const matched = msg.match('"Task status notification from the AWS StepFunction for execution name: (.*)\. The task status is (.*)\. Go to (.*) to view details on the execution\."');

    const colors = {
        'RUNNING': 'good',
        'SUCCEEDED': 'good',
        'TIMED_OUT': 'warning',
        'ABORTED': 'danger',
        'FAILED': 'danger'
    };
    const exec = matched[1];
    const stat = matched[2];
    const link = matched[3];

    const ts = new Date().toISOString();

    const data = JSON.stringify({
        text: `Execution: ${exec} has entered status: ${stat} <${link}|(view in web console)>`,
        attachments: [
            {
                fallback: msg,
                title: `Execution ${exec} is now status ${stat}`,
                color: colors[stat],
                fields: [{title: 'Timestamp', value: ts, short: true}, {
                    title: 'ExecutionName',
                    value: exec,
                    short: true
                }]
            }
        ]
    });

    return new Promise((resolve, reject) => {
        const request = https.request(process.env.SLACK_WEBHOOK_AMP, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            }
        }, (res) => {
            console.log(`statusCode: ${res.statusCode}`);
            res.on('data', (d) => process.stdout.write(d));
            res.on('end', () => resolve());
        });
        request.write(data);
        request.end();
    });
};