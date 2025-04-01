import {v2 as cloudinary} from 'cloudinary'
import { response } from 'express';
import fs from 'fs'


    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SECRET
    });

    //upload process

    const uploadOnCloudinary=async(localfilePath)=>{
        try {
            if(!localfilePath)return null;
            //upload the file on cloudinary
            const response = await cloudinary.uploader.upload(localfilePath,{
                resource_type:"auto"
            })
            /*
            file is uploaded successfully
             console.log("file is uploaded on cloudinary ", response.url);
            */
           fs.unlinkSync(localfilePath);
           return response;
        } catch (error) {
            fs.unlinkSync(localfilePath)
            return null;
        }
    }

    
const deleteFromCloudinary = async (fileUrl) => {
    try {
        if (!fileUrl) return null;
        
        // Extract Public ID from the URL (assuming Cloudinary URL structure)
        const publicId = fileUrl.split('/').pop().split('.')[0]; 
        
        // Delete the resource
        const res = await cloudinary.api.delete_resources([publicId]); 
        
        return res;
    } catch (error) {
        console.error("Cloudinary Deletion Error:", error);
        return null; // Returning null in case of failure
    }
}
    export {uploadOnCloudinary,deleteFromCloudinary}