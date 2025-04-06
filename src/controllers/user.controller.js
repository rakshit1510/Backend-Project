import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'
import mongoose from "mongoose";
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshToken= async(userId)=>{
    try {
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken

        await user.save({ validateBeforeSave: false })

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
     
    }
}

const RegisterUser = asyncHandler(async (req,res)=>{
        /*
        1. get user details from frontend
        2. validation -not empty 
        3. check for images ,check for avatar
        4. upload them to cloudinary ,avatar
        5. create user object - create db entry in db 
        6. remove password and refresh token field from response
        7. check for user creation
        8. return res
        */
    const {fullName,email,username,password}= req.body;
    if(
        [fullName,email,username,password].some((field)=>field.trim()==="")
    ){
        throw new ApiError(400,"All field are required")
    }
        const existUser=await User.findOne({

            $or: [{username},{email}]
        })
        if(existUser){
            throw new ApiError(409,"User with email or username already exist")
        }

        // console.log("req.files:", req.files);
        const avatarLocalPath=req.files?.avatar[0]?.path;
// console.log("req.files.avatar:", req.files?.avatar);

       let coverImageLocalPath
       if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
            coverImageLocalPath=req.files.coverImage[0].path
       }
       
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
       const avatar=await uploadOnCloudinary(avatarLocalPath)
       const coverImage=await uploadOnCloudinary(coverImageLocalPath)
       if(!avatar){
        throw new ApiError(400,"Avatar file is required")
       }
       const user=await User.create({
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase(),
       })
       const createdUser= await User.findById(user._id).select(
        //this field select the entities that are not to be choose while sending response to frontend 
        // or remove these entries from response

        "-password -refreshToken"
       )
       if(!createdUser){
        throw new ApiError(500, "something wents wrong while registering the user")
       }
       return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered Succesfully!!")
       )
})

const loginUser= asyncHandler(async(req,res)=>{
    const {username,email,password}=req.body;
    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }
    const user= await User.findOne({
        $or: [{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"user not found")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)    //here the 'user' is used not 'User' because the self made middlewares in models can be accessed by created 'user' not mongoose 'User' because it not the functionality of mongoose and for mungoose functionnality the 'User' is used and for seld made 'user' is used 

    if(!isPasswordValid){
        throw new ApiError(401,"wrong password entered")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
   
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true,
    }//this for refresh token to allow only server to to do manipulation with tokens and for browser it is only for view purpose

    return res
              .status(200)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",refreshToken,options)
              .json(
                new ApiResponse(200,
                    {
                        user: loggedInUser,accessToken,refreshToken
                    },
                    "User logged in Successfully"
                )
              )


})

const logoutUser=asyncHandler(async(req,res)=>{
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken : 1
                }
            },
            {
                new:true
            }
        )
        const options={
            httpOnly:true,
            secure:true,
        }
        return res
              .status(200)
              .clearCookie("accessToken",options)
              .clearCookie("refreshToken",options)
              .json(
                new ApiResponse(
                    200,
                    {},
                    "user Logged Out successfully"
                )
              )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user=await User.findById(req.user?._id)

    if(!user)throw new ApiError(400,"user does not exist")

    if(!oldPassword || !newPassword) new ApiError(400, "provide old and new password")
        
      const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)
      if(!isPasswordCorrect){
        throw new ApiError(400, "incorrect old password")
      }

      user.password=newPassword;

     await user.save({validateBeforeSave:false})

     return res
            .status(200)
            .json(
                 new ApiResponse(
                        200,
                        {},
                        "user password updated successfully"
                    )
            )
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
           .status(200)
           .json(
            new ApiResponse(200,req.user,"found current user successfully")
           )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body;
    if(!fullName || !email){
        throw new ApiError(400,"fullname or email not provided")
    }
    const user = req.user
    if(!user){
        throw new ApiError(400,"user not found or not logged in ")
    }

/*
    can use this or anther approach
*/

    // user.fullName=fullName
    // user.email=email
    // await user.save({validateBeforeSave:true})

       await User.findByIdAndUpdate(
        user._id,
        {
            $set:{
                fullName:fullName,
                email:email,
            }
            
        },
        {new:true}
       )

       return res
              .status(200)
              .json(
                new ApiResponse(200,
                {},
                "username and email updated successfully")
              )

       
})

const updateAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatar){
        throw new ApiError(400,"avatar not found")
    }
    const user=req.user
    if(!user){
        throw new ApiError(401,"User not found")
    }

   const uploadedAvatar=await uploadOnCloudinary(avatarLocalPath)
    if(uploadedAvatar.url){
        throw ApiError(400,"error while uploading on avatar")
    }
   await User.findByIdAndUpdate(
    user._id,
    {
        $set:{
            avatar: uploadedAvatar.url,
        }
    },
    {new:true}
   ).select("-password")

   return req
          .status(200)
          .json(
            new ApiResponse(200,user,"Avatar updated successfully")
          )
})


const updateCoverImage=asyncHandler(async(req,res)=>{
    const CoverImageLocalPath=req.file?.path
    if(!avatar){
        throw new ApiError(400,"CoverImage not found")
    }
    const user=req.user
    if(!user){
        throw new ApiError(401,"User not found")
    }

   const uploadedCoverImage=await uploadOnCloudinary(CoverImageLocalPath)
    if(uploadedCoverImage.url){
        throw ApiError(400,"error while uploading on CoverImage")
    }
   await User.findByIdAndUpdate(
    user._id,
    {
        $set:{
            avatar: uploadedCoverImage.url,
        }
    },
    {new:true}
   ).select("-password")

   return req
          .status(200)
          .json(
            new ApiResponse(200,user,"CoverImage updated successfully")
          )
})
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }
    
    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            }
        },
        {
            $lookup: {
                from: "subscriptions", 
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedTocount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user._id, "$subscribers.subscriber"] }, 
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                subscribersCount: 1,
                channelSubscribedTocount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
            }
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(400, "channel does not exist");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel, "User Channel fetched successfully"));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(req.user._id) // Convert ID to ObjectId
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    },
                ]
            }
        },
    ]);

    if (!user.length) {
        throw new ApiError(404, "User not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        );
});


export {
    RegisterUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}