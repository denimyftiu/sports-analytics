import 'source-map-support/register';
import serverlessExpress from '@vendia/serverless-express';
import { app } from './lib/analytics-app';

let serverlessExpressInstance: any = null


async function setup(event: any, context: any) {
    serverlessExpressInstance = serverlessExpress({ app })
    return serverlessExpressInstance(event, context)
}

export const handler = async (event: any, context: any, callback: any) => {
    context.callbackWaitsForEmptyEventLoop = false;
    console.log(JSON.stringify(event, null, 2));
    console.log(JSON.stringify(context, null, 2));

    if (serverlessExpressInstance) return serverlessExpressInstance(event, context)

    return setup(event, context)
};
