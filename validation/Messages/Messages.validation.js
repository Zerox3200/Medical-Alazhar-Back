import { check } from "express-validator";

export const sendMessageValidation = [
    check("subject").notEmpty().withMessage("Please add your subject."),
    check("phone").notEmpty().withMessage("Please add your phone."),
    check("message").notEmpty().withMessage("Please add your message."),
];
