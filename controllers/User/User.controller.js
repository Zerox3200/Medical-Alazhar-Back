import User from "../../models/Users/Users.js";
import httpStatusText from "../../utils/httpStatusText.js";

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

    const user = await User.create({ name, email, phone, password });

    res.status(201).json({
        status: httpStatusText.SUCCESS,
        code: 201,
        message: "User created successfully",
        success: true,
        data: { user },
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

    res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "User profile fetched successfully",
        success: true,
        data: { user },
    });
}