import AWS from 'aws-sdk'
import validator from '@middy/validator'
import { transpileSchema } from '@middy/validator/transpile'
import createHttpError from 'http-errors'
import commonMiddleware from '../lib/commonMiddleware'
import placeBidSchema from '../lib/schemas/placeBidSchema'
import { getAuctionById } from './getAuction'


const dynamodb = new AWS.DynamoDB.DocumentClient()

const placeBid = async (event, context) => {
    const { id } = event.pathParameters
    const { amount } = event.body
    const { email } = event.requestContext.authorizer

    const auction = await getAuctionById(id)

    // validate amount is a number
    if (isNaN(amount)) {
        throw new createHttpError.BadRequest(`The amount must be a number. Got ${amount}`)
    }

    // validate status auction
    if (auction.status !== 'OPEN') {
        throw new createHttpError.Forbidden('You cannot bid for closed auctions!')
    }

    // Bid amount cannot be less than the latest bid amount
    if (amount <= auction.highestBid.amount) {
        throw new createHttpError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`)
    }

    // Bid identity validation
    if (auction.seller === email) {
        throw new createHttpError.Forbidden('You cannot bid on your owns auctions!')
    }

    // Avoid double bidding
    if (auction.highestBid.bidder === email) {
        throw new createHttpError.Forbidden('You have the highest bid. You cannot bid twice!')
    }

    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
        ExpressionAttributeValues: {
            ':amount': amount,
            ':bidder': email,
        },
        ReturnValues: 'ALL_NEW'
    }

    try {
        const result = await dynamodb.update(params).promise()

        return {
            statusCode: 200,
            body: JSON.stringify(result.Attributes),
          };
    } catch (error) {
        console.log(error)
        throw new createHttpError.InternalServerError(error)
    }
}

export const handler = commonMiddleware(placeBid)
    .use(validator({ eventSchema: transpileSchema(placeBidSchema, { strict: true } )}))


