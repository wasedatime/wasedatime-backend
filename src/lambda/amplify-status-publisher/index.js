const https = require('https');

exports.handler = async (event) => {
    const msg = event.Records[0].Sns.Message;
    const matched = msg.match(/Build notification from the AWS Amplify Console for app: https:\/\/(.*)\.(.*)\.amplifyapp\.com\/\. Your build status is (.*)\. Go to (.*) to view details on your build\./);

    const colors = {
        'SUCCEED': 'good',
        'FAILED': 'danger',
        'STARTED': 'good'
    };
    const branch = matched[1];
    const appId = matched[2];
    const stat = matched[3];
    const link = matched[4];

    let url;

    if (branch === 'develop') {
        url = "https://dev.wasedatime.com/";
    } else if (branch === 'master') {
        url = "https://wasedatime.com/";
    } else {
        url = `https://${branch.replace(/\//g, '-').replace(/_/g, '-')}.${appId}.amplifyapp.com/`;
    }

    const data = JSON.stringify({
        text: `Branch: ${branch} has entered status: ${stat} <${link}|(view in web console)>`,
        attachments: [
            {
                fallback: msg,
                title: `Branch ${branch} is now status ${stat}`,
                color: colors[stat],
                fields: [
                    {
                        title: 'Website',
                      value: `<${url}|Click to view the branch>`,
                      short: true
                    },
                  {
                    title: 'Branch',
                    value: branch,
                    short: true
                  }
                ]
            }
        ],
      icon_url: "https://i.ibb.co/8r3mDbY/AWS-Amplify-3.png",
      username: "aws-amplify"
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