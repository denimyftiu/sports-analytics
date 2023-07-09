#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DatabaseStack } from '../lib/database-stack';
import { BackendStack } from '../lib/backend-stack';
import { ApiStack } from '../lib/api-stack'

const app = new cdk.App();

const dbStack = new DatabaseStack(app, 'database-stack', {
  stackName: 'database-stack',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

const backendStack = new BackendStack(app, 'backend-stack', {
  stackName: 'backend-stack',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  storageTable: dbStack.storageTable, 
  analyticsTable: dbStack.analyticsTable, 
});

new ApiStack(app, 'api-stack', {
  stackName: 'api-stack',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  ingestionHandler: backendStack.ingestionHandler, 
  anlyticsHandler: backendStack.analyticsHandler
})