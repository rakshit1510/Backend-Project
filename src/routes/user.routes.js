import {Router} from 'express'
import {  
    RegisterUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
}  from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { get } from 'mongoose'
const router=Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    RegisterUser
)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT.getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/updateAvatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route("/updateCoverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
export default router
