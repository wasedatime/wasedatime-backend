import {App} from "@aws-cdk/core";
import {WasedatimeWebApp} from "./stacks/webapp";

export class WasedaTime extends App {
    constructor() {
        super();

        new WasedatimeWebApp(this, 'wasedatime-webapp', {
            env: {
                account: '564383102056',
                region: 'ap-northeast-1'
            }
        });
    }
}