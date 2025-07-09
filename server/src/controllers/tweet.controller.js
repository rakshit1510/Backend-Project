import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content}=req.body
    const {user}=req.user
    if(!content){
        throw new ApiError(400,"provide content for tweet")
    }
    if(!user){
        throw new ApiError(400,"user not found")
    }
    const userId=user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    } 
    try {
        const tweet = await Tweet.create({
            owner: userId,
            content: content,
        });
        if (!tweet) {
            throw new ApiError(400, "Something went wrong while posting the tweet.");
        }
        return res.status(200).json(new ApiResponse(200, tweet, "Tweet created successfully."));
    } catch (error) {
        // Catching any error that might occur during the creation
        throw new ApiError(500, "Internal server error.");
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.params.userId;

    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const user=await User.findById(userId)
    if(!user){
        throw new ApiError(400,"user not found for this id")
    }

    const tweets= await Tweet.find({owner:userId})
    if(!tweets){
        throw new ApiError(400,"something went wrong while fetching tweets")
    }
    if(tweets.length===0){
        throw new ApiError(400,"not tweets are there for this user")
    }

    return res
            .status(200)
            .json(new ApiResponse(
                200,
                tweets,
                "tweets fetched for given user")
            )
})
 
const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content}=req.body
    const tweetId=req.params.tweetId
    const user=req.user
    if(!tweetId){
        throw new ApiError(400,"tweet Id not found")
    }
    if(!user){
        throw new ApiError(400,"user not found")
    }
    const userId=user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const tweet= await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400,"tweet not found")
    }
        // Check if the current user is the owner of the video
        if (userId.toString() !== tweet?.owner.toString()) {
            throw new ApiError(403, "User is not the owner of the video");
    
        }

        const new_tweet=await Tweet.findByIdAndUpdate(tweet?._id,
            {
                $set:{
                    content:content,
                },
            },
            { new: true } , // Returns the updated video document
        )
        if(!new_tweet){
            throw new ApiError(400,"something wents wrong while updating the tweet ")
        }
        return res.status(200).json(new ApiResponse(200,new_tweet,"tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const tweetId=req.params.tweetId
    const user=req.user
    if(!tweetId){
        throw new ApiError(400,"tweet Id not found")
    }
    if(!user){
        throw new ApiError(400,"user not found")
    }
    const userId=user?._id
    if(!userId){
        throw new ApiError(400,"userId not found")
    }
    const tweet= await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400,"tweet not found")
    }
        // Check if the current user is the owner of the video
        if (userId.toString() !== tweet?.owner.toString()) {
            throw new ApiError(403, "User is not the owner of the video");
    
        }

        const tweet_del= await Tweet.findByIdAndDelete(tweetId)
        if(!tweet_del){
            throw new ApiError(400,"somthing wents wrong while deleting the tweet")
        }
        return res.status(200).json(new ApiResponse(200,{},"tweet deleted successfully"))
})

export {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
}