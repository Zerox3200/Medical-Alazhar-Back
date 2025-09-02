import Joi from "joi";

export const createChapterValidation = Joi.object({
    title: Joi.string().required().min(3).max(100).messages({
        "string.empty": "Chapter title is required",
        "string.min": "Chapter title must be at least 3 characters long",
        "string.max": "Chapter title must not exceed 100 characters",
    }),
    description: Joi.string().required().min(10).max(500).messages({
        "string.empty": "Chapter description is required",
        "string.min": "Chapter description must be at least 10 characters long",
        "string.max": "Chapter description must not exceed 500 characters",
    }),
    order: Joi.number().integer().min(1).required().messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
        "any.required": "Order is required",
    }),
    sectionId: Joi.string().required().messages({
        "string.empty": "Section ID is required",
        "any.required": "Section ID is required",
    }),
});

export const updateChapterValidation = Joi.object({
    title: Joi.string().min(3).max(100).messages({
        "string.min": "Chapter title must be at least 3 characters long",
        "string.max": "Chapter title must not exceed 100 characters",
    }),
    description: Joi.string().min(10).max(500).messages({
        "string.min": "Chapter description must be at least 10 characters long",
        "string.max": "Chapter description must not exceed 500 characters",
    }),
    order: Joi.number().integer().min(1).messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
    }),
    sectionId: Joi.string().messages({
        "string.empty": "Section ID is required",
    }),
    isPublished: Joi.boolean(),
});

export const chapterValidation = {
    createChapterValidation,
    updateChapterValidation,
};
