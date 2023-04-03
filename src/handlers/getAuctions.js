import AWS from 'aws-sdk'
import createHttpError from 'http-errors'
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'
import getAuctionSchema from '../lib/schemas/getAuctionSchema'
import commonMiddleware from '../lib/commonMiddleware'


const dynamodb = new AWS.DynamoDB.DocumentClient()

const getAuctions = async (event, context) => {
    const { status } = event.queryStringParameters
    let auctions

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        IndexName: 'statusAndEndDate',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeValues: {
            ':status': status,
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        },
    }

    try {
        const result = await dynamodb.query(params).promise()

        auctions = result.Items

        return {
            statusCode: 200,
            body: JSON.stringify(auctions),
          };
    } catch (error) {
        console.log(error)
        throw new createHttpError.InternalServerError(error)
    }
}

export const handler = commonMiddleware(getAuctions)
    .use(validator({ eventSchema: transpileSchema(getAuctionSchema, {strict: true, useDefaults: true} )}))


