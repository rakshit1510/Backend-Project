import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary ,deleteFromCloudinary} from "../utils/Cloudinary.js";

   
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
  const videos=await Video.find({owner:userId});
    if(!videos){
        throw new ApiError(400,"can't fetch vidoes")
    }
    if(videos.size()==0){
        throw new ApiError(350 ,  "no video is uploaded")
    }

})
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400,"provide both title and description")
    }
    const videoLocalPath=req.files?.videoFile[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required")
    }
    const videoFile= await uploadOnCloudinary(videoLocalPath);
    if(!videoFile){
        throw new ApiError(404,"video file is required")
    }
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "video file is required")
    }
    const thumbnail= await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnail){
        throw new ApiError(404,"thumbnail file is required")
    }
    const new_video= await Video.create({
            videoFile:videoFile.url,
            thumbnail:thumbnail.url,
            title:title,
            description:description,
            duration:videoFile.duration,
            views:0,
            isPublished:true,
            owner:req.user?._id,
    })
    if(!new_video){
        throw new ApiError(409,"something went wrong while uploading the video")
    }
    return res
          .status(200)
          .json( 
            new ApiResponse(200,
                            new_video,
                            "video uploaded successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const videoId = req.params.videoId;
        if (!videoId) {
            throw new ApiError(401, "Video ID not found");
        }

        const user = req.user;
        if (!user) {
            throw new ApiError(400, "User not found");
        }

        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(402, "Video not found");
        }

        const owner = video.owner; // Owner should be in the video document
        if (!owner) {
            throw new ApiError(402, "Video owner not found");
        }

        if (owner.toString() !== user._id.toString()) {
            throw new ApiError(404, "User is not the owner of this video");
        }

        const videoUrl = video.videoFile;
        if (!videoUrl) {
            throw new ApiError(402, "Video URL not found");
        }

        // Delete video document from the database
        const videodel = await Video.findByIdAndDelete(videoId);
        if (!videodel) {
            throw new ApiError(400, "Something went wrong while deleting the video");
        }

        // Delete video from Cloudinary
        await deleteFromCloudinary(videoUrl);

        return res.status(200).json(
            new ApiResponse(200, {}, "Video deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting video:", error);
        throw error;
    }
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId){
        throw new ApiError(400,"videoId does not found")
    }

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video does not found for this video id")
    }
    return res
            .status(200)
            .json(
                new ApiResponse(200,
                 video,
                 "video fetched successfully")
                )
})
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    // Validate that videoId exists
    if (!videoId) {
        throw new ApiError(400, "Video ID not found");
    }

    const { title, description } = req.body;
    const userId = req.user?._id; // Assuming the user is authenticated via middleware
    // Validate that userId is found
    if (!userId) {
        throw new ApiError(400, "User ID not found");
    }

    // Find the video by videoId
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the current user is the owner of the video
    if (userId != video.owner) {
        throw new ApiError(403, "User is not the owner of the video");
    }

    // Handle thumbnail file
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    // Upload the thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(400, "Failed to upload thumbnail");
    }

    // Validate title and description
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    // Update the video details
    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnail.url, // assuming thumbnail.url is the correct property
            }
        },
        { new: true } // Returns the updated video document
    );

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video updated successfully")
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
     // Validate that userId is found
     const userId = req.user?._id; // Assuming the user is authenticated via middleware
   
     if (!userId) {
        throw new ApiError(400, "User ID not found");
    }

    // Find the video by videoId
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    // Check if the current user is the owner of the video
    if (userId.toString() !== video.owner.toString()) {
        throw new ApiError(403, "User is not the owner of the video");

    }

    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set: {
                togglePublishStatus: !video.togglePublishStatus,
            }
        },
        { new: true } // Returns the updated video document
    );
    if(!updateVideo){
        throw new ApiError(400,"something wents wrong while updating ")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "togglestatus updated successfully")
    );
})
export {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
}