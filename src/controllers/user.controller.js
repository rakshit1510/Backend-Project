import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import {ApiResponse} from '../utils/ApiResponse.js'
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

        const avatarLocalPath=req.files?.avatar[0]?.path;
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
        username : username.tolowerCase(),
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

export {RegisterUser}