import {expect as expectCDK, MatchStyle, matchTemplate} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as WasedatimeBackend from '../lib/stacks/webapp';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new WasedatimeBackend.WasedatimeWebApp(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
