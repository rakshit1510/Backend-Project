import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {Comment} from "../models/comment.model.js"

const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");

const getVideoComments = asyncHandler(async (req, res, next) => {           
    try {
        const { videoId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Convert page and limit to numbers
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        const pageNumber = parseInt(page, 10);
        // Validate videoId
        if (!mongoose.Types.ObjectId.isValid(videoId)) {
            return next(new ApiError(400, "Invalid video ID"));
        }

        // Use aggregation pipeline to get comments with pagination
        const commentsData = await Comment.aggregate([
            { $match: { videoId: new mongoose.Types.ObjectId(videoId) } },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNumber },
        ]);

        // Count total comments for pagination info
        const totalComments = await Comment.countDocuments({ videoId });

        res.status(200).json(new ApiResponse(
            200,
            commentsData,
            "All comments retrieved successfully",
            {
                totalComments,
                currentPage: pageNumber,
                totalPages: Math.ceil(totalComments / limitNumber),
            }
        ));
    } catch (error) {
        next(new ApiError(500, "Server Error", error.message));
    }
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}=req.params
    const {user}=req.user
    const {content}=req.body
    if(!videoId){
        throw new ApiError(400, "video id does not found")
    }
    if(!content){
        throw new ApiError(400,"Please provide the content for comment")
    }
    if(!user){
        throw new ApiError(400, "user does not found")  
    }
    const userId=user?._id
    if(!userId){
        throw new ApiError(400, "user id does not found")  
    }
  try {
      const comment= await Comment.create({
          owner:user?._id,
          content:content,
          video:videoId,
      })
      if(!comment){
          throw new ApiError(400,"somthing wents wrong while creating comment")
      }
      return res.status(200).json(200,comment,"comment created succesfully")
  } catch (error) {
    throw new ApiError(500,"internal server error")
  }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params
    const {user}=req.user
    const {content}=req.body
    if(!commentId){
        throw new ApiError(400, "comment id does not found")
    }
    if(!content){
        throw new ApiError(400,"Please provide the content for comment")
    }
    if(!user){
        throw new ApiError(400, "user does not found")  
    }
    const userId=user?._id
    if(!userId){
        throw new ApiError(400, "user id does not found")  
    }
    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "comment  not found")
    }
    if(comment?.owner!=userId){
        throw new ApiError(400,"user is not owner of this comment")
    }
    const new_comment=await Comment.findByIdAndUpdate(commentId,  {
        $set:{
            content:content,
        },
    },
    { new: true } , // Returns the updated video document
)
if(new_comment){
    throw new ApiError(400,"somthing wents wrong while updating ")
}
return res.status(200,new_comment,"comment updated successfully")
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params
    const {user}=req.user
    if(!commentId){
        throw new ApiError(400, "comment id does not found")
    }
   if(!user){
        throw new ApiError(400, "user does not found")  
    }
    const userId=user?._id
    if(!userId){
        throw new ApiError(400, "user id does not found")  
    }
    const comment=await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(400, "comment  not found")
    }
    if(comment?.owner!=userId){
        throw new ApiError(400,"user is not owner of this comment")
    }
    const del_com=await Comment.findByIdAndDelete(commentId)
    if(del_com){
        throw new ApiError(400,"somthing wents wrong while deleting comment ")
    }
    return res.status(200).json(200,{},"comment deleted successfully")
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }