import mongoose from "mongoose";
import { User } from "./user.model.js";

const tweetSchema= new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",  
    },
    content:{
        type:String,
        required:true,
    },
    

},{timestamps:true})

export const Tweet= mongoose.model("Tweet",tweetSchema)