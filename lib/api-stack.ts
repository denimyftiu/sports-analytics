import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface ApiStackProps extends cdk.StackProps {
    ingestionHandler: lambda.Function;
    anlyticsHandler: lambda.Function;
}

export class ApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        const api = new apigateway.LambdaRestApi(this, 'ingestion-api', {
            restApiName: "ingestion-api",
            handler: props.ingestionHandler,
            proxy: true,
            integrationOptions: {
                proxy: true,
                allowTestInvoke: true
            }
        });

        const analyticsApi = new apigateway.LambdaRestApi(this, 'analytics-api', {
            restApiName: "analytics-api",
            handler: props.anlyticsHandler,
            proxy: true,
            integrationOptions: {
                proxy: true,
                allowTestInvoke: true
            }
        });
    }
}
