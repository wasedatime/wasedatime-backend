const https = require('https');

const colors = {
  'RUNNING': 'good',
  'SUCCEEDED': 'good',
  'TIMED_OUT': 'warning',
  'ABORTED': 'danger',
  'FAILED': 'danger'
};

exports.handler = async (event) => {
  const detail = event.detail;

  const exec = detail.name;
  const stat = detail.status;
  const arn = detail.executionArn;
  const link = `https://ap-northeast-1.console.aws.amazon.com/states/home?region=ap-northeast-1#/executions/details/${arn}`;

  const ts = new Date().toISOString();

  const data = JSON.stringify({
    text: `Execution: ${exec} has entered status: ${stat} <${link}|(view in web console)>`,
    attachments: [
      {
        title: `Execution ${exec} is now status ${stat}`,
        color: colors[stat],
        fields: [
          {
            title: 'Timestamp',
            value: ts,
            short: true
          },
          {
            title: 'Execution',
            value: exec,
            short: true
          }
        ]
      }
    ],
    icon_url: "https://i.ibb.co/zZrG2fN/AWS-Lambda-light-bg-2.png",
    username: "aws-stepfunctions"
  });

  return new Promise((resolve, reject) => {
    const request = https.request(process.env.SLACK_WEBHOOK_URL, {
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
