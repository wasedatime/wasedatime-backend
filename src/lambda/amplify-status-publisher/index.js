const https = require('https');

exports.handler = async (event) => {
    const msg = event.Records[0].Sns.Message;
    const matched = msg.match(/Build notification from the AWS Amplify Console for app: https:\/\/(.*)\..*\.amplifyapp\.com\/\. Your build status is (.*)\. Go to (.*) to view details on your build\./);

    const colors = {
        'SUCCEED': 'good',
        'FAILED': 'danger',
        'STARTED': 'good'
    };
    const branch = matched[1];
    const stat = matched[2];
    const link = matched[3];

    const ts = new Date().toISOString();

    const data = JSON.stringify({
        text: `Branch: ${branch} has entered status: ${stat} <${link}|(view in web console)>`,
        attachments: [
            {
                fallback: msg,
                title: `Branch ${branch} is now status ${stat}`,
                color: colors[stat],
                fields: [{title: 'Timestamp', value: ts, short: true}, {
                    title: 'BranchName',
                    value: branch,
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