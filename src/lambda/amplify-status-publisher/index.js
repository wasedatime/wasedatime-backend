const https = require('https');

const colors = {
  'SUCCEED': 'good',
  'FAILED': 'danger',
  'STARTED': 'good',
};

const apps = {
  'dvqo5dg5k8e6d': "ROOT",
  'd4mmu2hx77tt5': "FEEDS",
  'd30wetah1y35e8': "CAMPUS",
  'd3tfy2z9dqnnsk': "SYLLABUS",
};

exports.handler = async (event) => {
  const detail = event.detail;
  const branch = detail.branchName;
  const appId = detail.appId;
  const stat = detail.jobStatus;
  const jobId = detail.jobId;
  const appName = apps[appId];

  const link = `https://ap-northeast-1.console.aws.amazon.com/amplify/home?region=ap-northeast-1#${appId}/${branch}/${jobId}`;

  let url;

  if (branch === 'develop') {
    url = "https://dev.wasedatime.com/";
  } else if (branch === 'master') {
    url = "https://wasedatime.com/";
  } else {
    url = `https://${branch.replace(/\//g, '-').replace(/_/g, '-')}.${appId}.amplifyapp.com/`;
  }

  const data = JSON.stringify({
    text: `[${appName}]Branch: ${branch} has entered status: ${stat} <${link}|(view in web console)>`,
    attachments: [
      {
        title: `[${appName}]Branch ${branch} is now status ${stat}`,
        color: colors[stat],
        fields: [
          {
            title: 'Website',
            value: `<${url}|Click to view the branch>`,
            short: true,
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