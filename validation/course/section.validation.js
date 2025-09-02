import Joi from "joi";

export const createSectionValidation = Joi.object({
    title: Joi.string().required().min(3).max(100).messages({
        "string.empty": "Section title is required",
        "string.min": "Section title must be at least 3 characters long",
        "string.max": "Section title must not exceed 100 characters",
    }),
    description: Joi.string().required().min(10).max(500).messages({
        "string.empty": "Section description is required",
        "string.min": "Section description must be at least 10 characters long",
        "string.max": "Section description must not exceed 500 characters",
    }),
    order: Joi.number().integer().min(1).required().messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
        "any.required": "Order is required",
    }),
});

export const updateSectionValidation = Joi.object({
    title: Joi.string().min(3).max(100).messages({
        "string.min": "Section title must be at least 3 characters long",
        "string.max": "Section title must not exceed 100 characters",
    }),
    description: Joi.string().min(10).max(500).messages({
        "string.min": "Section description must be at least 10 characters long",
        "string.max": "Section description must not exceed 500 characters",
    }),
    order: Joi.number().integer().min(1).messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
    }),
    isPublished: Joi.boolean(),
});

export const sectionValidation = {
    createSectionValidation,
    updateSectionValidation,
};
