import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyJWT);

// Get all videos
router.get("/", getAllVideos);

// Upload a new video with file uploads
router.post("/", upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
]), publishAVideo);

// Get a specific video
router.get("/:videoId", getVideoById);

// Update a video (thumbnail upload allowed)
router.patch("/:videoId", upload.single("thumbnail"), updateVideo);

// Delete a video
router.delete("/:videoId", deleteVideo);

// Toggle publish status
router.patch("/toggle/publish/:videoId", togglePublishStatus);

export default router;
