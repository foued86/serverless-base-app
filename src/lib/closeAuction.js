import AWS from 'aws-sdk'

const dynamodb = new AWS.DynamoDB.DocumentClient()
const sqs = new AWS.SQS()

export const closeAuction = async (auction) => {
    const params = {
        TableName: process.env.AUCTIONS_TABLE_NAME,
        Key: { id: auction.id },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeValues: {
            ':status': 'CLOSED',
        },
        ExpressionAttributeNames: {
            '#status': 'status',
        }
    }

    await dynamodb.update(params).promise()
    
    return Promise.all([notifySeller(auction), notifyBidder(auction)])

}

const notifySeller = (auction) => {
    const { title, seller, highestBid } = auction
    let subject, body

    if (highestBid.amount === 0) {
        subject = 'No bids on your auction item!'
        body = `Your item "${title}" didn't get any bids. Better luck next time!`
    } else {
        subject = 'Your item has been sold!'
        body = `Your item "${title}" has been sold for $${highestBid.amount}`
    }

    return sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject,
            recipient: seller,
            body, 
        })
    }).promise()
}

const notifyBidder = (auction) => {
    const { title, highestBid } = auction

    return sqs.sendMessage({
        QueueUrl: process.env.MAIL_QUEUE_URL,
        MessageBody: JSON.stringify({
            subject: 'You won an auction!',
            recipient: highestBid.bidder,
            body: `Great deal! You got yourself a "${title}" for $${highestBid.amount}`
        })
    }).promise()
}