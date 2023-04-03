const createAuctionSchema = {
    type: 'object',
    required: [
        'body',
    ],
    properties: {
        body: {
            type: 'object',
            required: ['title'],
            properties: {
                title: {
                    type: 'string',
                }
            },
        },
    },
}

export default createAuctionSchema