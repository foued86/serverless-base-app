import AWS from 'aws-sdk'
const dynamodb = new AWS.DynamoDB.DocumentClient()

export const saveAuctionPicture = async (id, url) => {
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id },
        UpdateExpression: 'set pictureUrl = :pictureUrl',
        ExpressionAttributeValues: {
            ':pictureUrl': pictureUrl,
        },
        ReturnValues: 'ALL_NEW'
    }

    const result = await dynamodb.update(params).promise()

    return result.Attributes
}