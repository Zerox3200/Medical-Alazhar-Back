import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: [true, "Sender is required"],
    },
    subject: {
        type: String,
        required: [true, "Subject is required"],
    },
    phone: {
        type: Number,
        required: [true, "Phone is required"],
    },
    message: {
        type: String,
        required: [true, "Message is required"],
    },
    isRead: {
        type: Boolean,
        default: false,
    }
})

const Message = mongoose.model("Message", MessageSchema);

export default Message;