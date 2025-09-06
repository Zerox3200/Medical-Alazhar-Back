import Intern from "../../models/intern/Intern.models.js";
import Message from "../../models/Messages/Messages.model.js";
import Supervisor from "../../models/supervisor/supervisor.models.js";
import { ErrorCatch } from "../../utils/appError.js";
import httpStatusText from "../../utils/httpStatusText.js";

export const createMessage = ErrorCatch(async (req, res, next) => {
    const { subject, phone, message } = req.body;
    const { id } = req.user;

    const checkUser = await Intern.findById(id);

    if (!checkUser) {
        return res.status(404).json({
            message: "User not found.",
            success: false,
            status: "fail"
        });
    }

    const checkMessage = await Message.findOne({ phone, sender: id, subject, message });

    if (checkMessage) {
        return res.status(400).json({
            success: false,
            status: "fail",
            message: "Message already exists.",
        });
    }

    const CreateMessage = await Message.create({ subject, phone, message, sender: id });

    if (!CreateMessage) {
        return res.status(400).json({
            success: false,
            status: "fail",
            message: "Message not created.",
        });
    }

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        code: 201,
        message: "Message created successfully.",
        success: true,
    });
});

export const getAllMessages = ErrorCatch(async (req, res, next) => {

    const messages = await Message.find().populate("sender", "fullname");

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        messages,
        message: "Messages fetched successfully.",
        success: true,
    });
})

export const deleteMessage = ErrorCatch(async (req, res, next) => {
    const { messageId } = req.params;

    const checkMessage = await Message.findById(messageId);

    if (!checkMessage) {
        return res.status(404).json({
            success: false,
            status: "fail",
            message: "Message not found.",
        });
    }

    await Message.findByIdAndDelete(messageId);

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "Message deleted successfully.",
        success: true,
    });
});

export const messageSeen = ErrorCatch(async (req, res, next) => {
    const { messageId } = req.params;



    const checkMessage = await Message.findById(messageId);

    if (!checkMessage) {
        return res.status(404).json({
            success: false,
            status: "fail",
            message: "Message not found.",
        });
    }

    await Message.findByIdAndUpdate(messageId, { isRead: checkMessage.isRead === true ? false : true });

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "Message seen successfully.",
        success: true,
    });
});

export const getMessage = ErrorCatch(async (req, res, next) => {
    const { messageId } = req.params;

    const checkMessage = await Message.findById(messageId);



    if (!checkMessage) {
        return res.status(404).json({
            success: false,
            status: "fail",
            message: "Message not found.",
        });
    }

    let getSender = await Intern.findById(checkMessage.sender);

    if (!getSender) {
        getSender = await Supervisor.findById(checkMessage.sender);
    }

    const NeededUser = {
        name: getSender.fullname,
        email: getSender.email
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        NeededUser,
        messageDetails: checkMessage,
        message: "Message fetched successfully.",
        success: true,
    });
});