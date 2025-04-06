import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const user = req.user;

    if (!user || !user._id) {
        throw new ApiError(400, "User not found");
    }

    if (!channelId) {
        throw new ApiError(400, "Channel ID not found");
    }

    if (user._id.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(400, "Channel does not exist");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: user._id,
        channel: channelId,
    });

    let subscribed;

    if (existingSubscription) {
        // ❌ Unsubscribe
        await Subscription.deleteOne({ _id: existingSubscription._id });
        subscribed = false;
    } else {
        // ✅ Subscribe
        await Subscription.create({
            subscriber: user._id,
            channel: channelId,
        });
        subscribed = true;
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            { subscribed },
            subscribed ? "Subscribed successfully" : "Unsubscribed successfully"
        )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const user = req.user;

    if (!user || !user._id) {
        throw new ApiError(400, "User not found");
    }

    if (!channelId) {
        throw new ApiError(400, "Channel ID not found");
    }

    // if (user._id.toString() !== channelId.toString()) {
    //     throw new ApiError(400, "You cannot see others subscribers list");
    // }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(400, "Channel does not exist");
    }

    const existingSubscription = await Subscription.find({
        channel: channelId,
    });

    if( !existingSubscription || existingSubscription.length==0){
        throw new ApiError(400,"no subscribers are there")
    }
    return res.status(200).json(new ApiResponse(200,existingSubscription,"list fetched successfully"))
})

    // controller to return channel list to which user has subscribed
    const getSubscribedChannels = asyncHandler(async (req, res) => {
        const { subscriberId } = req.params
        const user = req.user;
        if (!subscriberId) {
            throw new ApiError(400, "subscriber ID not found");
        }
        const subscriber=await User.findById(subscriberId)
        if(!subscriber){
            throw new ApiError(400, "subscriber not found for this id ");  
        }
        if (!user || !user._id) {
            throw new ApiError(400, "User not found");
        }

        

        if (user._id.toString() !== channelId.toString()) {
            throw new ApiError(400, "You cannot see other's subscribed list");
        }


        const existingSubscription = await Subscription.find({
            subscriber: subscriberId,
            
        });

        if( !existingSubscription || existingSubscription.length==0){
            throw new ApiError(400,"no channels are there")
        }
        return res.status(200).json(new ApiResponse(200,existingSubscription,"list fetched successfully"))
    })



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}