import bcrypt from "bcryptjs/dist/bcrypt.js";
import User from "../../models/Users/Users.model.js";
import httpStatusText from "../../utils/httpStatusText.js";
import { deleteImage } from "../../services/cloudnairyUpload.js";
import Course from "../../models/course/course.models.js";

// Create Normal User
export const createNormalUser = async (req, res, next) => {
    const { name,
        email,
        phone,
        password
    } = req.body;

    const [CheckEmail, CheckPhone] = await Promise.all([
        User.findOne({ email }),
        User.findOne({ phone })
    ]);

    if (CheckEmail || CheckPhone) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "Email or phone already exists",
            success: false,
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, phone, password: hashedPassword });

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        code: 201,
        message: "User created successfully",
        success: true,
        data: { user },
    });
}

// Update User Profile
export const updateUserProfile = async (req, res, next) => {
    const { user } = req;
    const { name, phone } = req.body;

    const newProfileImage = req.uploadedFile ? req.uploadedFile.url : null;


    if (newProfileImage) {
        await deleteImage(user.profileImage);
    }

    let updatedUser

    if (newProfileImage) {
        updatedUser = await User.findByIdAndUpdate(user._id, {
            name,
            phone,
            profileImage: newProfileImage
        }, { new: true });
    } else {
        updatedUser = await User.findByIdAndUpdate(user._id, {
            name,
            phone,
        }, { new: true });
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "User profile updated successfully",
        success: true,
        data: { updatedUser },
    });
}

// Get User Profile
export const getUserProfile = async (req, res, next) => {
    const { user } = req;

    if (!user) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "User not found",
            success: false,
        });
    }

    const getSubscriptions = await Course.find({ NormalUserSubscriptions: { $in: [user._id] } });

    const NeededUser = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: "user",
        subscriptions: getSubscriptions,
    }

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "User profile fetched successfully",
        success: true,
        data: NeededUser,
    });
}

//***********************************************Subscriptions ***********************************************/

// Subscribe to course
export const userSubscripeToCourse = async (req, res, next) => {
    const { user } = req;
    const { courseId } = req.params;

    const course = await Course.findById(courseId);

    if (!course) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course not found",
            success: false,
        });
    }

    const NormalUserSubscriptions = course.NormalUserSubscriptions;
    const CheckSubscription = NormalUserSubscriptions
        .some((subscription) => subscription.userId.toString() === user._id.toString());

    if (CheckSubscription) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "You are already subscribed to this course",
            success: false,
        });
    }

    const updatedCourse = await Course.findByIdAndUpdate(courseId, {
        $push: {
            NormalUserSubscriptions: {
                userId: user._id,
                subscriptionDate: Date.now(),
            }
        }
    }, { new: true });

    if (!updatedCourse) return res.status(400).json({
        status: httpStatusText.ERROR,
        code: 400,
        message: "Error subscribing to course",
        success: false,
    });

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "You are now subscribed to this course",
        success: true,
        updatedCourse
    });
}


// delete user
export const deleteUser = async (req, res, next) => {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "User deleted successfully",
    });
}

// get all users
export const getAllUsers = async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        users,
    });
}