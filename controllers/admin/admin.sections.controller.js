import Section from "../../models/course/section.models.js";
import Chapter from "../../models/course/chapter.models.js";
import Course from "../../models/course/course.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import { ErrorCatch } from "../../utils/appError.js";

// Create new section
export const createSection = ErrorCatch(async (req, res, next) => {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    checkIdValidity(courseId, res);

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Course not found.",
            success: false,
        });
    }

    // Check if order already exists for this course
    const existingSection = await Section.findOne({ courseId, order });
    if (existingSection) {
        return res.status(400).json({
            status: httpStatusText.ERROR,
            code: 400,
            message: "A section with this order already exists in this course.",
            success: false,
        });
    }

    const section = await Section.create({
        title,
        description,
        order,
        courseId,
    });

    // Add section to course
    await Course.findByIdAndUpdate(courseId, {
        $push: { sections: section._id },
    });

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        code: 201,
        section,
        message: "Section created successfully.",
        success: true,
    });
});

// Get all sections for a course
export const getCourseSections = asyncWrapper(async (req, res, next) => {
    const { courseId } = req.params;

    checkIdValidity(courseId, res);

    const sections = await Section.find({ courseId })
        .populate({
            path: "chapters",
            select: "title description order isPublished",
            options: { sort: { order: 1 } },
        })
        .sort({ order: 1 })
        .lean();

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        sections,
        message: "Sections fetched successfully.",
        success: true,
    });
});

// Get single section
export const getSection = asyncWrapper(async (req, res, next) => {
    const { sectionId } = req.params;

    checkIdValidity(sectionId, res);

    const section = await Section.findById(sectionId)
        .populate({
            path: "chapters",
            select: "title description order isPublished",
            options: { sort: { order: 1 } },
        })
        .lean();

    if (!section) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Section not found.",
            success: false,
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        section,
        message: "Section fetched successfully.",
        success: true,
    });
});

// Update section
export const updateSection = asyncWrapper(async (req, res, next) => {
    const { sectionId } = req.params;
    const { title, description } = req.body;

    checkIdValidity(sectionId, res);

    const section = await Section.findById(sectionId);
    if (!section) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Section not found.",
            success: false,
        });
    }

    const updatedSection = await Section.findByIdAndUpdate(
        sectionId,
        { title, description },
        { new: true }
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        section: updatedSection,
        message: "Section updated successfully.",
        success: true,
    });
});

// Delete section
export const deleteSection = asyncWrapper(async (req, res, next) => {
    const { sectionId, courseId } = req.params;
    const { oldOrder } = req.body;

    checkIdValidity(sectionId, res);

    const section = await Section.findById(sectionId);
    if (!section) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Section not found.",
            success: false,
        });
    }

    await Chapter.deleteMany({ sectionId });

    await Course.findByIdAndUpdate(courseId, {
        $pull: { sections: sectionId },
    });

    await Section.findByIdAndDelete(sectionId);

    const remainingSections = await Section.find({
        courseId: courseId,
        order: { $gt: oldOrder }
    }).sort({ order: 1 });

    for (let i = 0; i < remainingSections.length; i++) {
        const newOrder = oldOrder + i;
        await Section.findByIdAndUpdate(
            remainingSections[i]._id,
            { order: newOrder }
        );
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        message: "Section and all its chapters deleted successfully, and order re-arranged.",
        success: true,
    });

});


// Update section status
export const updateSectionStatus = asyncWrapper(async (req, res, next) => {
    const { sectionId } = req.params;
    const { isPublished } = req.body;

    checkIdValidity(sectionId, res);

    const section = await Section.findById(sectionId).populate("chapters");
    if (!section) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Section not found.",
            success: false,
        });
    }

    // Allow publishing sections even if they don't have chapters yet
    const updatedSection = await Section.findByIdAndUpdate(
        sectionId,
        { isPublished },
        { new: true }
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        section: updatedSection,
        message: "Section status updated successfully.",
        success: true,
    });
});
