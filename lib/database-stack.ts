import * as cdk from 'aws-cdk-lib';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {

    storageTable: ddb.Table;
    analyticsTable: ddb.Table;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.storageTable = new ddb.Table(this, "main-table", { tableName: "main-table",
            partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
            sortKey: { name: "SK", type: ddb.AttributeType.STRING },
            stream: ddb.StreamViewType.NEW_IMAGE,

            billingMode: ddb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });


        this.analyticsTable = new ddb.Table(this, "analytics-table", {
            tableName: "analytics-table",
            partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
            sortKey: { name: "SK", type: ddb.AttributeType.STRING },

            billingMode: ddb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        // Used to list matches
        this.analyticsTable.addGlobalSecondaryIndex({
            indexName: 'GSI1',
            partitionKey: { name: "GSI1PK", type: ddb.AttributeType.STRING },
            sortKey: { name: "GSI1SK", type: ddb.AttributeType.STRING },
        })
    }
}
