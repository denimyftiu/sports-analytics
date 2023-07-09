# sports-analytics

This project is a demo application that showcases the setup of infrastructure and backend deployment for a live sports analytics site.

## Infrastructure Setup

The infrastructure for this project is managed using AWS CloudFormation and the AWS CDK (Cloud Development Kit). It provisions 2 Api Gateways (one for ingestion and one for retirieving analytics data) also 2 AWS Lambda's who run the handlers. 1 AWS Lambda which handles the CDC from the AWS Dynamodb Streams of Ingested Events.'

To set up the infrastructure, follow these steps:

1. Install the AWS CLI and configure your AWS credentials in the default account.
2. Use node version `v18.16.1` and npm version `9.8.0`.
3. Clone this repository and navigate to the project root directory.
4. Install the project dependencies by running `npm install` installs the dependencies for the infrastructure deployment.
5. Move to the `./backend` folder where the lambda handlers and application login lives and run `npm install`.

## Deployment Instructions

To deploy the backend application, follow these steps:

1. Navigate to the `backend` folder.
2. Run `npm run build` to build the typescript project.
3. Run `npm run webpack` to build the `bundle` directory where the lambda handlers are packaged up.
4. At this point we have all the lambda artifacts to deploy the application so we move back to the root of the projects `cd ../`.
5. Now we can deploy the infrastructure `cdk deploy --all --require-approval never` after we have made sure to install cdk command line tool `npm i -g aws-cdk`.
6. The output of this command will return 2 links by the end of execution which will be marked as ingestion API and analytics API. BE CAREFUL the links will contain the /prod stage from AWS API gateway as default stage.

## Backend Setup

The backend application is built using Node.js, Express.js, and the AWS SDK (v3). It provides the API endpoints for retrieving match information, statistics, and events for matches and teams.

Important to check for understanding how the backend is setup:
1. Files in `./backend/src/*-handler.ts` are always lambda handlers.
2. Files in `./backend/lib` contain the application logic.
3. When running `npm run build` everything gets compiled into javascript at the `./backend/dist/` folder.
4. When running `npm run webpack` every lambda handler will be bundled into `./backend/bundle`. Look at the contents of webpack.config.js since it contains important login on importing static assets or native files non javascript code into the bundle ( for example prisma engines or font assets). Check `./lib/backend-stack.ts` to understand how the bundle is than uploaded into Lambda from CDK.

To set up the backend locally for development or testing, follow these steps:

1. Make sure you have deployed the infrastructure. This makes sure that the dynamodb tables exist and you have admin credentials locally setup on your default profile.
2. At this point you can run `npm run dev:ingest` or `npm run dev:analytics` which open ports 3000 or 3001 locally.
3. These commands setup the dyanmodb table names in the local environment and run `./backend/*-dev.ts` express servers.

## API Documentation

The API endpoints exposed by the backend application are as follows:

- `GET /matches`: Retrieve a list of all matches.
- `GET /matches/{match_id}`: Retrieve details of a specific match.
- `GET /matches/{match_id}/statistics`: Retrieve statistics for a specific match.
- `GET /teams/{team_name}/statistics`: Retrieve statistics for a specific team across all matches.


## Ingest with CURL

### Create Match
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "match_id": "12345",
  "timestamp": "2023-06-22T19:45:30Z",
  "team": "FC Barcelona",
  "opponent": "Real Madrid",
  "event_type": "goal",
  "event_details": {
    "player": {
      "name": "Lionel Messi",
      "position": "Forward",
      "number": 10
    },
    "goal_type": "penalty",
    "minute": 30,
    "assist": {
      "name": "Sergio Busquets",
      "position": "Midfielder",
      "number": 5
    },
    "video_url": "https://example.com/goal_video.mp4"
  }
}' https://<apiurl>/prod/

```
### Win Match
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "match_id": "12345",
  "timestamp": "2023-06-22T19:45:30Z",
  "team": "FC Barcelona",
  "opponent": "Real Madrid",
  "event_type": "win"
}' https://<apiurl>/prod/

```