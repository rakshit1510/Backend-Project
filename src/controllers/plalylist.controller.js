import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import {Playlist} from '../models/playlist.model.js'
import { app } from "../app";


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    const user=req.user
    
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    if(!name  || !description){
        throw new ApiError(400,"provide name and description both")
    }
    if(!user || !user._id){
        throw new ApiError(400,"user id not found")
    }
    const playlist = await Playlist.create({
        name:name,
        description:description,
        video:[],
        owner:user?._id,
    })
    if(!playlist){
        throw new ApiError(400,"playlist created successfully")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"playlist created successfully"))
})
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID not provided");
    }

    const user = req.user;

    if (!user || !user._id) {
        throw new ApiError(400, "User not found");
    }

    const playlists = await Playlist.find({ owner: userId }).populate("video"); // if video is a reference

    if (playlists.length === 0) {
        throw new ApiError(404, "No playlists found for this user");
    }

    return res.status(200).json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId) {
        throw new ApiError(400, "Playlist ID not provided");
    }

    const user = req.user;

    if (!user || !user._id) {
        throw new ApiError(400, "User not found");
    }

    const playlist = await Playlist.findById(playlistId).populate("video");

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    );
});
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const user = req.user;

    if (!playlistId || !videoId) {
        throw new ApiError(400, "Playlist ID or Video ID is missing");
    }

    if (!user || !user._id) {
        throw new ApiError(400, "User not found");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { video: videoId } }, // avoids duplicates
        { new: true }
    ).populate("video"); // optional: if you want to show video details

    if (!updatedPlaylist) {
        throw new ApiError(500, "Failed to add video to playlist");
    }

    return res.status(200).json(
        new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const user= req.user
    if(!videoId || !playlistId){
        throw new ApiError(400,"videoId or playlistId not found")
    }
    if (!user) {
        throw new ApiError(400, "User not found");
    }
    if(!user || !user._id){
        throw new ApiError(400,"user id not found")
    }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"something wents wrong")
    }
    if(user._id != playlist.owner){
        throw new ApiError(400,"user is not the owner of this playlist")
    }
    

    const video=await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"video with this Id not found")
    }

    const videos=playlist.video
    if(!videos){
        throw new ApiError(400,"videos of playlist not found")
    }

    const new_video=videos.map(v=>v!=videoId)

    const updatedPlaylist= await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            video:new_video,
        },
    },
{new:true},
)

    if(!updatedPlaylist){
        throw new ApiError(400,"something wents wrong while removing video to playlist ")
    }

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"video removed to playlist"))



})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400,"playlist Id not found {please provide it}")
    }
    const user=req.user
    
    if (!user) {
        throw new ApiError(400, "User not found");
    }
    if(!user || !user._id){
        throw new ApiError(400,"user id not found")
    }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"something wents wrong")
    }
    if(user._id != playlist.owner){
        throw new ApiError(400,"user is not the owner of this playlist")
    }
    const deletion=await Playlist.findByIdAndDelete(playlistId)
    if(!deletion){
        throw new ApiError(400,"somthing wents wrong in deletion of playlist")
    }
    return res.status(200).json(new ApiResponse(200,{},"playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    const user=req.user
    
    //TODO: update playlist

    if (!user) {
        throw new ApiError(400, "User not found");
    }
    if(!user || !user._id){
        throw new ApiError(400,"user id not found")
    }
    if(!name  || !description){
        throw new ApiError(400,"provide name and description both")
    }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(400,"something wents wrong")
    }
    if(user._id != playlist.owner){
        throw new ApiError(400,"user is not the owner of this playlist")
    }

    const updatedPlaylist= await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name:name,
            description:description,
        },
    },
{new:true},
)

    if(!updatedPlaylist){
        throw new ApiError(400,"something wents wrong while updating playlist ")
    }

    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"playlist updated successfully"))
    

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}