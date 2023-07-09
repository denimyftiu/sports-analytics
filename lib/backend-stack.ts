import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface BackendStackProps extends cdk.StackProps {
    storageTable: ddb.Table;
    analyticsTable: ddb.Table;
}

export class BackendStack extends cdk.Stack {
    ingestionHandler: lambda.Function;
    analyticsHandler: lambda.Function;
    eventProcessor: lambda.Function;

    constructor(scope: Construct, id: string, props: BackendStackProps) {
        super(scope, id, props);

        this.ingestionHandler = new lambda.Function(this, 'ingestion-handler', {
            functionName: 'ingestion-handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../backend/bundle/ingestion-handler')),
            memorySize: 1024,
            timeout: cdk.Duration.minutes(15),
            environment: {
                STORAGE_TABLE_NAME: props.storageTable.tableName
            }
        });
        props.storageTable.grantWriteData(this.ingestionHandler);

        this.eventProcessor = new lambda.Function(this, 'event-handler', {
            functionName: 'event-handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../backend/bundle/event-handler/')),
            timeout: cdk.Duration.minutes(15),
            environment: {
                ANALYTICS_TABLE_NAME: props.analyticsTable.tableName
            }
        });
        props.analyticsTable.grantReadWriteData(this.eventProcessor);

        this.eventProcessor.addEventSource(new lambdaEventSources.DynamoEventSource(props.storageTable, {
            batchSize: 10,
            startingPosition: lambda.StartingPosition.TRIM_HORIZON
        }))

        this.analyticsHandler = new lambda.Function(this, 'analytics-handler', {
            functionName: 'analytics-handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../backend/bundle/analytics-handler')),
            memorySize: 1024,
            timeout: cdk.Duration.minutes(15),
            environment: {
                ANALYTICS_TABLE_NAME: props.analyticsTable.tableName
            }
        });
        props.analyticsTable.grantReadData(this.analyticsHandler);
    }
}