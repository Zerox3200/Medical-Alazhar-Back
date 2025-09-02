import Chapter from "../../models/course/chapter.models.js";
import Section from "../../models/course/section.models.js";
import Video from "../../models/course/video.models.js";
import asyncWrapper from "../../middlewares/asyncWrapper.js";
import httpStatusText from "../../utils/httpStatusText.js";
import checkIdValidity from "../../utils/checkIdValidity.js";
import { ErrorCatch } from "../../utils/appError.js";

// Create new chapter
export const createChapter = ErrorCatch(async (req, res, next) => {
    const { sectionId } = req.params;
    const { title, description, order } = req.body;

    checkIdValidity(sectionId, res);

    // Check if section exists
    const section = await Section.findById(sectionId);
    if (!section) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Section not found.",
            success: false,
        });
    }

    const chapter = await Chapter.create({
        title,
        description,
        order,
        sectionId,
        courseId: section.courseId,
    });

    // Add chapter to section
    await Section.findByIdAndUpdate(sectionId, {
        $push: { chapters: chapter._id },
    });

    return res.status(201).json({
        status: httpStatusText.SUCCESS,
        code: 201,
        chapter,
        message: "Chapter created successfully.",
        success: true,
    });
});

// Get all chapters for a section
export const getSectionChapters = asyncWrapper(async (req, res, next) => {
    const { sectionId } = req.params;

    checkIdValidity(sectionId, res);

    const chapters = await Chapter.find({ sectionId })
        .populate({
            path: "videos",
            select: "title url duration description level quizId",
            options: { sort: { createdAt: 1 } },
        })
        .sort({ order: 1 })
        .lean();

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        chapters,
        message: "Chapters fetched successfully.",
        success: true,
    });
});

// Get single chapter
export const getChapter = asyncWrapper(async (req, res, next) => {
    const { chapterId } = req.params;

    checkIdValidity(chapterId, res);

    const chapter = await Chapter.findById(chapterId)
        .populate({
            path: "videos",
            select: "title url duration description level quizId",
            options: { sort: { createdAt: 1 } },
        })
        .lean();

    if (!chapter) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Chapter not found.",
            success: false,
        });
    }

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        chapter,
        message: "Chapter fetched successfully.",
        success: true,
    });
});

// Update chapter
export const updateChapter = asyncWrapper(async (req, res, next) => {
    const { chapterId } = req.params;
    const { title, description, order, isPublished } = req.body;

    checkIdValidity(chapterId, res);

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Chapter not found.",
            success: false,
        });
    }

    // If order is being changed, check for conflicts
    if (order && order !== chapter.order) {
        const existingChapter = await Chapter.findOne({
            sectionId: chapter.sectionId,
            order,
            _id: { $ne: chapterId },
        });
        if (existingChapter) {
            return res.status(400).json({
                status: httpStatusText.ERROR,
                code: 400,
                message: "A chapter with this order already exists in this section.",
                success: false,
            });
        }
    }

    const updatedChapter = await Chapter.findByIdAndUpdate(
        chapterId,
        { title, description, order, isPublished },
        { new: true }
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        chapter: updatedChapter,
        message: "Chapter updated successfully.",
        success: true,
    });
});

// Delete chapter
export const deleteChapter = asyncWrapper(async (req, res, next) => {
    const { chapterId } = req.params;

    checkIdValidity(chapterId, res);

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Chapter not found.",
            success: false,
        });
    }

    try {
        // Use a transaction to ensure data consistency
        const session = await Chapter.startSession();
        await session.withTransaction(async () => {
            // First, delete all videos in this chapter
            await Video.deleteMany({ chapterId }, { session });

            // Remove chapter from section
            await Section.findByIdAndUpdate(
                chapter.sectionId,
                { $pull: { chapters: chapterId } },
                { session }
            );

            // Delete the chapter first
            await Chapter.findByIdAndDelete(chapterId, { session });

            // Then reorder remaining chapters to avoid conflicts
            const remainingChapters = await Chapter.find({
                sectionId: chapter.sectionId,
                order: { $gt: chapter.order }
            }).sort({ order: 1 }).session(session);

            // Update orders sequentially to avoid unique constraint conflicts
            for (let i = 0; i < remainingChapters.length; i++) {
                const newOrder = chapter.order + i;
                await Chapter.findByIdAndUpdate(
                    remainingChapters[i]._id,
                    { order: newOrder },
                    { session }
                );
            }
        });

        await session.endSession();

        return res.status(200).json({
            status: httpStatusText.SUCCESS,
            code: 200,
            message: "Chapter and all its videos deleted successfully, and order re-arranged.",
            success: true,
        });
    } catch (error) {
        console.error('Error deleting chapter:', error);
        return res.status(500).json({
            status: httpStatusText.ERROR,
            code: 500,
            message: "Error deleting chapter. Please try again.",
            success: false,
        });
    }
});

// Update chapter status
export const updateChapterStatus = asyncWrapper(async (req, res, next) => {
    const { chapterId } = req.params;
    const { isPublished } = req.body;

    checkIdValidity(chapterId, res);

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
        return res.status(404).json({
            status: httpStatusText.ERROR,
            code: 404,
            message: "Chapter not found.",
            success: false,
        });
    }

    const updatedChapter = await Chapter.findByIdAndUpdate(
        chapterId,
        { isPublished },
        { new: true }
    );

    return res.status(200).json({
        status: httpStatusText.SUCCESS,
        code: 200,
        chapter: updatedChapter,
        message: "Chapter status updated successfully.",
        success: true,
    });
});
