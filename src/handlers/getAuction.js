import AWS from 'aws-sdk'
import commonMiddleware from '../lib/commonMiddleware'
import createHttpError from 'http-errors'


const dynamodb = new AWS.DynamoDB.DocumentClient()

export const getAuctionById = async (id) => {
    try {
        const result = await dynamodb.get({ 
            TableName: process.env.AUCTIONS_TABLE_NAME,
            Key: { id }
        }).promise()

        if (!result.Item) {
            throw new createHttpError.NotFound(`Auction with ID  ${id} is not found`)
        }

        return result.Item
    } catch (error) {
        console.log(error)
        throw new createHttpError.InternalServerError(error)
    }
}

const getAuction = async (event, context) => {
    const { id } = event.pathParameters
    const auction = await getAuctionById(id)

    return {
        statusCode: 200,
        body: JSON.stringify(auction),
      };
}

export const handler = commonMiddleware(getAuction)


