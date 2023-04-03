const uploadAuctionPictureSchema = {
    type: 'string',
    required: ['body'],
    properties: {
        body: {
            type: 'string',
            minLength: 1,
            pattern: '\=$',
        }
    },
}

export default uploadAuctionPictureSchema