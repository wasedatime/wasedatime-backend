import {App} from "@aws-cdk/core";
import {WasedatimeWebApp} from "./stacks/webapp";
import {ApiEndpoint} from "./stacks/restful-api";
import {awsEnv} from "./configs/code-automation";

export class WasedaTime extends App {
    constructor() {
        super();

        new WasedatimeWebApp(this, 'wasedatime-webapp', awsEnv);

        new ApiEndpoint(this, 'wasedatime-api', awsEnv);
    }
}