import * as process from 'process';
import { v4 as uuidv4 } from 'uuid';
import { marshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import express, {Express, Request, Response} from 'express';

export const app: Express = express();
app.use(express.json());

const dynamoDBClient = new DynamoDBClient({ region: 'eu-central-1' });

app.post('/', async (req: Request, res: Response) => {
    const event = req.body;
    const eventId = uuidv4();

    // Prepare item to be stored in DynamoDB
    const item = {
        PK: `EVENT#${eventId}`,
        SK: `EVENT#${eventId}`,
        ...event,
        createdAt: (new Date()).toISOString()
    };

    // Configure PutItem command
    const params = {
        TableName: process.env.STORAGE_TABLE_NAME!,
        Item: marshall(item)
    };

    try {
        // Put the item in DynamoDB
        await dynamoDBClient.send(new PutItemCommand(params));
        res.status(200).json({
            status: 'sucess',
            message: 'Data successfully ingested.',
            data: {
                eventId,
                timestamp: item.timestamp
            }
        });
    } catch (err) {
        console.error('Failed to store event:', err);
        res.status(400).json({
            status: "error",
            message: "Failed to ingest data.",
            error: "Internal Server Error."
        });
    }
});
