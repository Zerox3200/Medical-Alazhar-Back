import { Router } from "express";
import isAuthenticated from "../../middlewares/isAuthenticated.js";
import { createMessage, deleteMessage, getAllMessages, getMessage, messageSeen } from "../../controllers/Messages/Messages.controller.js";
import isAdmin from "../../middlewares/isAdmin.js";
import validate from "../../validation/validate.js";
import { sendMessageValidation } from "../../validation/Messages/Messages.validation.js";

const router = Router();

// send message
router.post("/sendMessage", isAuthenticated, validate(sendMessageValidation), createMessage);

// get all messages
router.get("/getAllMessages", isAuthenticated, isAdmin, getAllMessages);

// delete message
router.delete("/deleteMessage/:messageId", isAuthenticated, isAdmin, deleteMessage);

// message seen
router.patch("/messageSeen/:messageId", isAuthenticated, isAdmin, messageSeen);

// get message
router.get("/getMessage/:messageId", isAuthenticated, isAdmin, getMessage);


export default router;