import { Router } from 'express';
import  {searchContent}
     from "../controllers/search.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.route("/").get(searchContent)
export default router