import middy from "@middy/core"
import httpErrorHandler from "@middy/http-error-handler"
import validator from "@middy/validator"
import cors from '@middy/http-cors'
import createHttpError from "http-errors"
import { getAuctionById } from "./getAuction"
import { uploadAuctionPictureToS3 } from "../lib/uploadPictureToS3"
import { saveAuctionPicture } from "../lib/saveAuctionPicture"
import uploadAuctionPictureSchema from "../lib/schemas/uploadAuctionPictureSchema"


export const uploadAuctionPicture = async (event) => {
    let updatedAuction
    const { id } = event.pathParameters
    const { email } = event.requestContext.authorizer
    const auction = await getAuctionById(id)
    
    if (!auction) {
        throw new createHttpError.NotFound(`Auction with id ${id} is not found!`)
    }

    // The person who upload the picture should be the seller
    if (email !== auction.seller) {
        throw new createHttpError.Forbidden(`You would be the seller to upload picture!`)
    }

    try {
        const base64 = event.body.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(base64, 'base64')
        const pictureUrl = uploadAuctionPictureToS3(auction.id + '.jpg', buffer)
        updatedAuction = await saveAuctionPicture(auction.id, pictureUrl)

        return {
            statusCode: 200,
            body: JSON.stringify(updatedAuction)
        }
    } catch (error) {
        console.error(error)
        throw new createHttpError.InternalServerError(error)
    }
    
}

export const handler = middy(uploadAuctionPicture)
    .use(httpErrorHandler)
    .use(validator({ eventSchema: transpileSchema(uploadAuctionPictureSchema, { strict: true }) }))
    .use(cors())