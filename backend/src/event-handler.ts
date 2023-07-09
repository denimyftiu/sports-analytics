import * as process from 'process';
import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';

const dynamoDBClient = new DynamoDBClient({ region: 'eu-central-1' });

export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    try {
        for (const record of event.Records) {
            if (record.eventName === 'INSERT') {
                const eventItem = record.dynamodb?.NewImage;
                if (eventItem) {
                    const matchId = eventItem.match_id.S!;
                    const teamName = eventItem.team.S!;

                    await updateMatchStatistics(matchId, eventItem);
                    await updateTeamStatistics(teamName, eventItem);
                    await storeEventInMatch(matchId, eventItem);
                }
            }
        }
    } catch (err) {
        console.error('Error processing DynamoDB stream event:', err);
    }
};

export async function updateMatchStatistics(matchId: string, eventItem: any) {
    const goalType = eventItem.event_details.M.goal_type.S;

    const updateParams: UpdateItemCommandInput = {
        TableName: process.env.ANALYTICS_TABLE_NAME!,
        Key: { 'PK': { S: `MATCH#${matchId}` }, 'SK': { S: 'STATS' } },
        UpdateExpression: 
        `SET #totalGoals = if_not_exists(#totalGoals, :zero) + :increment,
            #totalFouls = if_not_exists(#totalFouls, :zero) + :foulIncrement`,
        ExpressionAttributeNames: {
            '#totalGoals': 'total_goals',
            '#totalFouls': 'total_fouls',
        },
        ExpressionAttributeValues: {
            ':increment': { N: '1' },
            ':foulIncrement': { N: goalType === 'foul' ? '1' : '0' },
            ':zero': { N: '0' },
        }
    };

    await dynamoDBClient.send(new UpdateItemCommand(updateParams));
}

async function updateTeamStatistics(teamName: string, eventItem: any) {
    const queryParams: GetItemCommandInput = {
        TableName: process.env.ANALYTICS_TABLE_NAME!,
        Key: { PK: { S: `TEAM#${teamName}` }, SK: { S: 'STATS' } }
    };

    const queryResult = await dynamoDBClient.send(new GetItemCommand(queryParams));
    let updateExpression: string;
    let expressionAttributeValues: any;

    if (!queryResult.Item) {
        // Create initial statistics for the team
        updateExpression = 
        `SET #totalMatches = :zero,
             #totalWins = :zero,
             #totalDraws = :zero,
             #totalLosses = :zero,
             #totalGoalsScored = :zero `;

        expressionAttributeValues = {
            ':zero': { N: '0' }
        };
    } else {
        // Update existing statistics for the team
        updateExpression = `
      SET #totalMatches = if_not_exists(#totalMatches, :zero) + :increment,
          #totalWins = if_not_exists(#totalWins, :zero) + :winIncrement,
          #totalDraws = if_not_exists(#totalDraws, :zero) + :drawIncrement,
          #totalLosses = if_not_exists(#totalLosses, :zero) + :lossIncrement,
          #totalGoalsScored = if_not_exists(#totalGoalsScored, :zero) + :goalScoredIncrement
    `;

        const goalType = eventItem.event_details.M.goal_type.S;
        const winIncrement = eventItem.event_type.S === 'win' ? 1 : 0;
        const drawIncrement = eventItem.event_type.S === 'draw' ? 1 : 0;
        const lossIncrement = eventItem.event_type.S === 'loss' ? 1 : 0;
        const goalScoredIncrement = goalType === 'goal' ? 1 : 0;

        expressionAttributeValues = {
            ':increment': { N: '1' },
            ':winIncrement': { N: winIncrement.toString() },
            ':drawIncrement': { N: drawIncrement.toString() },
            ':lossIncrement': { N: lossIncrement.toString() },
            ':goalScoredIncrement': { N: goalScoredIncrement.toString() },
            ':zero': { N: '0' }
        };
    }

    const updateParams: UpdateItemCommandInput = {
        TableName: process.env.ANALYTICS_TABLE_NAME!,
        Key: { PK: { S: `TEAM#${teamName}` }, SK: { S: 'STATS' } },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
            '#totalMatches': 'total_matches',
            '#totalWins': 'total_wins',
            '#totalDraws': 'total_draws',
            '#totalLosses': 'total_losses',
            '#totalGoalsScored': 'total_goals_scored',
        },
        ExpressionAttributeValues: expressionAttributeValues
    };

    await dynamoDBClient.send(new UpdateItemCommand(updateParams));
}

async function storeEventInMatch(matchId: string, eventItem: any) {
    console.log(JSON.stringify(eventItem, null, 2))
    const item = {
        ...eventItem,
        PK: { S: `MATCH#${matchId}` },
        SK: { S: `EVENT#${eventItem.createdAt.S}` },
        GSI1PK: { S: `MATCH` },
        GSI1SK: { S: `MATCH#${matchId}` },
    }
    console.log(JSON.stringify(item, null, 2))

    const putParams: PutItemCommandInput = {
        TableName: process.env.ANALYTICS_TABLE_NAME!,
        Item: item
    };

    await dynamoDBClient.send(new PutItemCommand(putParams));
}