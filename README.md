# WasedaTime Backend

![](https://travis-ci.com/wasedatime/wasedatime-backend.svg?branch=develop)
![](https://img.shields.io/website?up_color=green&up_message=online&url=https%3A%2F%2Fwasedatime.com)

This repository defines the serverless application architecture, resource configuration and infrastructure provision strategy of 
[wasedatime.com](https://wasedatime.com).

## Architecture

We adopted a simple serverless application architecture, consisted of four layers: *Presentation Layer*, *Business Layer*, 
*Persistence Layer* and *Admin Layer*.

### Presentation Layer

![Presentation Layer](doc/pre.png)

### Business Layer

![Business Layer](doc/biz.png)

### Persistence Layer

![Persistence Layer](doc/pers.png)

### Admin Layer

![Admin Layer](doc/admin.png)

## CDK Usage
The `cdk.json` file tells the CDK Toolkit how to execute your app.

### Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
