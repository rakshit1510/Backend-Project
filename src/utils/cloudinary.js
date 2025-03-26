import {v2 as cloudinary} from 'cloudinary'
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

    export {uploadOnCloudinary}