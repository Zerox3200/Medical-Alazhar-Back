import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    profileImage: {
        type: String,
        default: null,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    loginAttempts: {
        type: Number,
        default: 0,
    }
});


const User = mongoose.models.Users || mongoose.model("User", userSchema);

export default User;
