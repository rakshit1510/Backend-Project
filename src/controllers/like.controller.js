import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Like} from '../models/like.model.js'
import { User } from "../models/user.model.js";
import {Video} from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = req.user;

    if (!user) {
        throw new ApiError(400, "User not found");
    }

    if (!videoId) {
        throw new ApiError(400, "Video ID not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, "Video with this ID does not exist");
    }

    const userId = user._id;

    // Check if like already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId,
    });

    if (existingLike) {
        // Unlike the video
        await existingLike.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Video unliked successfully"));
    }

    // Like the video
    const like = await Like.create({
        video: videoId,
        likedBy: userId,
    });

    if (!like) {
        throw new ApiError(400, "Something went wrong while liking the video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, like, "Video liked successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id; // assuming user is logged in and available

    // Check if the like already exists for this comment and user
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    });

    if (existingLike) {
        // If already liked, remove it (unlike)
        await existingLike.deleteOne();
        res.status(200).json({ message: "Comment unliked" });
    } else {
        // If not liked yet, create a like
        const newLike = await Like.create({
            comment: commentId,
            likedBy: userId
        });
        res.status(201).json({ message: "Comment liked", like: newLike });
    }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id; // assuming user is logged in and available in req.user

    // Check if the like already exists
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if (existingLike) {
        // If like exists, remove it (unlike)
        await existingLike.deleteOne();
        res.status(200).json({ message: "Tweet unliked" });
    } else {
        // If like doesn't exist, create it
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: userId
        });
        res.status(201).json({ message: "Tweet liked", like: newLike });
    }
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "User not authenticated");
    }

    // Find all likes by the user that are linked to videos
    const likedVideoLikes = await Like.find({
        likedBy: user._id,
        video: { $ne: null }, // ensure it's a video like
    }).populate("video"); // populate video details

    // Extract the video objects from the likes
    const likedVideos = likedVideoLikes.map((like) => like.video);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}