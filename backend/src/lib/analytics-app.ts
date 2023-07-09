import * as process from 'process';
import { unmarshall, } from '@aws-sdk/util-dynamodb';
import { DynamoDBClient, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import express, { Express, Request, Response } from 'express';
import { clearItem, unmarshallList } from './util';

export const app: Express = express();
app.use(express.json());

const dynamoDBClient = new DynamoDBClient({ region: 'eu-central-1' });

app.get('/matches', async (req: Request, res: Response) => {
    try {
        const queryParams = {
            TableName: process.env.ANALYTICS_TABLE_NAME!,
            IndexName: 'GSI1',
            KeyConditionExpression: '#pk = :pk',
            ExpressionAttributeNames: {
                '#pk': 'GSI1PK'
            },
            ExpressionAttributeValues: {
                ':pk': { S: 'MATCH' }
            }
        };

        const data = await dynamoDBClient.send(new QueryCommand(queryParams));
        const matches = data.Items || [];

        res.json({
            status: 'sucess',
            matches: unmarshallList(matches)
        });
    } catch (err) {
        console.error('Error retrieving matches:', err);
        res.status(400).json({
            status: "error",
            message: "Failed to retrieve data.",
            error: "An error occurred while retrieving matches."
        });
    }
});

app.get('/matches/:match_id', async (req: Request, res: Response) => {
    try {
        const matchId = req.params.match_id;

        const queryParams = {
            TableName: process.env.ANALYTICS_TABLE_NAME,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
            ExpressionAttributeValues: {
                ':pk':  { S: `MATCH#${matchId}` },
                ':sk': { S: 'EVENT#' }
            }
        };

        const data = await dynamoDBClient.send(new QueryCommand(queryParams));
        const events = data.Items || [];

        res.json(unmarshallList(events));
    } catch (err) {
        console.error('Error retrieving match events:', err);
        res.status(400).json({
            status: "error",
            message: "Failed to retrieve data.",
            error: "An error occurred while retrieving match events"
        });
    }
});

app.get('/matches/:match_id/statistics', async (req: Request, res: Response) => {
    try {
        const matchId = req.params.match_id;

        const queryParams = {
            TableName: process.env.ANALYTICS_TABLE_NAME!,
            Key: { PK: { S: `MATCH#${matchId}` }, SK: { S: 'STATS' } }
        };

        const data = await dynamoDBClient.send(new GetItemCommand(queryParams));

        if (!data.Item) {
            res.status(404).json({ status: 'error', error: 'Match statistics not found' });
        } else {
            res.json(clearItem(unmarshall(data.Item)));
        }
    } catch (err) {
        console.error('Error retrieving match statistics:', err);
        res.status(400).json({
            status: "error",
            message: "Failed to retrieve data.",
            error: "An error occurred while retrieving match statistics"
        });
    }
});

app.get('/teams/:team_name/statistics', async (req: Request, res: Response) => {
    try {
        const teamName = req.params.team_name;
        console.log(teamName)

        const queryParams = {
            TableName: process.env.ANALYTICS_TABLE_NAME!,
            Key: { PK: { S:`TEAM#${teamName}` }, SK: { S: 'STATS' } }
        };

        const data = await dynamoDBClient.send(new GetItemCommand(queryParams));

        if (!data.Item) {
            res.status(404).json({ status: 'error', error: 'Team statistics not found' });
        } else {
            res.json(clearItem(unmarshall(data.Item)));
        }
    } catch (err) {
        console.error('Error retrieving team statistics:', err);
        res.status(400).json({
            status: "error",
            message: "Failed to retrieve data.",
            error: "An error occurred while retrieving team statistics"
        });
    }
});