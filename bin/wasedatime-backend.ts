#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { WasedatimeBackendStack } from '../lib/wasedatime-backend-stack';

const app = new cdk.App();
new WasedatimeBackendStack(app, 'WasedatimeBackendStack');
