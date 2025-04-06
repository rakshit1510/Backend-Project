import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
const searchContent = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.trim() === "") {
        throw new ApiError(400, "Search query is required");
    }

    // Search videos by title or description
    const videoResults = await Video.find({
        $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ]
    }).populate("channel", "username");

    // Search channels by username
    const channelResults = await User.find({
        username: { $regex: query, $options: "i" }
    });

    return res.status(200).json(new ApiResponse(200, {
        videos: videoResults,
        channels: channelResults
    }, "Search results fetched successfully"));
});

export {searchContent}