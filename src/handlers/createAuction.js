import { v4 as uuid } from 'uuid'
import AWS from 'aws-sdk'
import createHttpError from 'http-errors'
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'
import createAuctionSchema from '../lib/schemas/createAuctionSchema'
import commonMiddleware from '../lib/commonMiddleware'


const dynamodb = new AWS.DynamoDB.DocumentClient()

const createAuction = async (event, context) => {
  const { title } = event.body
  const { email } = event.requestContext.authorizer
  const now = new Date()
  const endDate = new Date()
  endDate.setHours(now.getHours() + 1)

  const auction = {
    id: uuid(),
    title,
    status: 'OPEN',
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: {
      amount: 0,
    },
    seller: email,
  }

  try {
    await dynamodb.put({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: auction,
    }).promise()
  } catch (error) {
    console.log(error)
    throw new createHttpError.InternalServerError(error)
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
}

export const handler = commonMiddleware(createAuction)
  .use(validator({ eventSchema: transpileSchema(createAuctionSchema, { strict: true }) }))


