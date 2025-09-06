import { check } from "express-validator";
import _ from "lodash";
import Intern from "../../models/intern/Intern.models.js";

// List Of Faculties
const egyptianMedicalUniversities = [
  "Cairo University",
  "Ain Shams University",
  "Alexandria University",
  "Assiut University",
  "Mansoura University",
  "Zagazig University",
  "Tanta University",
  "Suez Canal University",
  "Benha University",
  "Menoufia University",
  "South Valley University",
  "Fayoum University",
  "Minia University",
  "Kafr El-Sheikh University",
  "Sohag University",
  "Beni-Suef University",
  "Aswan University",
  "Damietta University",
  "Helwan University",
  "Port Said University",
  "Damanhour University",
  "Luxor University",
  "New Valley University",
  "Matrouh University",
  "Sinai University",
  "Misr University for Science and Technology (MUST)",
  "October 6 University",
  "Ahram Canadian University",
  "Nile University",
  "British University in Egypt (BUE)",
  "German University in Cairo (GUC)",
  "Future University in Egypt (FUE)",
  "Badr University in Cairo (BUC)",
  "Galala University",
  "King Salman International University",
  "Delta University for Science and Technology",
  "New Giza University",
  "Egyptian Russian University",
  "Sphinx University",
  "Deraya University",
  "Al-Azhar University for Boys",
  "Al-Azhar University for Girls",
  "Military Medical Academy",
];

const facultyList = () => {
  let list = [];
  for (let university of egyptianMedicalUniversities) {
    list.push(`${university} - Faculty of Medicine`);
  }
  return list;
};

// Grades
const grades = ["A+", "A", "B+", "B", "C+", "C", "D+", "D"];

// Check if intern existed in database
const checkExistingUser = async (record, msg) => {
  const intern = await Intern.findOne(record);
  if (intern) {
    throw new Error(msg);
  }
};

export const internSignupValidation = [
  // English name
  check("fullname")
    .notEmpty()
    .trim()
    .withMessage("English name must be provided")
    .matches(/^[A-Za-z-]{2,}(\s[A-Za-z-]{2,}){3,}$/)
    .withMessage("Please enter your name in English as in your national ID"),
  // Arabic name
  check("arabicName")
    .notEmpty()
    .trim()
    .withMessage("Arabic name must be provided")
    .matches(/^[\u0600-\u06FF]+(\s[\u0600-\u06FF]+){1,3}$/)
    .withMessage("Please enter your name in Arabic as in your national ID"),
  // Date Of Birth
  check("dob")
    .notEmpty()
    .trim()
    .withMessage("Date of birth must be provided")
    .isDate({ format: "YYYY-MM-DD", delimiters: ["-"] })
    .withMessage("Please enter a valid date in YYYY-MM-DD format"),
  // Cummulative Total
  check("cummulativeTotal")
    .notEmpty()
    .trim()
    .withMessage("Cummulative total must be provided")
    .isFloat()
    .withMessage("Please enter your cummulative total as 6541.20"),
  // Internship Start Date
  check("internshipStartDate")
    .notEmpty()
    .trim()
    .withMessage("Internship start date must be provided")
    .isDate({ format: "YYYY-MM-DD", delimiters: ["-"] })
    .withMessage("Please enter a valid date in YYYY-MM-DD format"),
  // Intern Level
  check("internLevel")
    .notEmpty()
    .trim()
    .withMessage("Level must be provided")
    .isIn(["mi_1", "mi_2"])
    .withMessage("Select from the list"),
  // Nationality
  check("nationality")
    .notEmpty()
    .trim()
    .withMessage("Nationality must be provided"),
  /* National ID/Passport Number  */
  // Type Validation
  check("idOrPassport.type")
    .notEmpty()
    .trim()
    .withMessage("Please select the type of your identity")
    .isIn(["nationalID", "passport"])
    .withMessage("This identity is not listed"),
  // number Validation
  check("idOrPassport.number")
    .notEmpty()
    .trim()
    .withMessage("The number of your identity must be provided")
    .custom((value, { req }) => {
      const type = req.body.idOrPassport.type;
      const passportRegex = /^[A-Za-z0-9]{6,12}$/;
      const nationalIDRegex = /^[23]\d{12}[0-9]$/;
      if (type === "nationalID" && !nationalIDRegex.test(value)) {
        throw new Error(
          "Please enter a valid national ID number (starts with 2 or 3, followed by 13 digits)"
        );
      }
      if (type === "passport" && !passportRegex.test(value)) {
        throw new Error(
          "Please enter a valid passport number (6-12 alphanumeric characters)"
        );
      }
      return true;
    })
    .custom(async (value, { req }) => {
      const passportRegex = /^[A-Za-z0-9]{6,12}$/;
      const nationalIDRegex = /^[23]\d{12}[0-9]$/;
      const existingIDPassport = await Intern.findOne({
        "idOrPassport.number": value,
      });
      if (existingIDPassport && nationalIDRegex.test(value)) {
        throw new Error("This national ID is already in use");
      }
      if (existingIDPassport && passportRegex.test(value)) {
        throw new Error("This passport number is already in use");
      }
    }),
  // Faculty of Graduation
  check("facultyOfGraduation")
    .notEmpty()
    .trim()
    .withMessage("ID or Passport number must be provided")
    .isIn(facultyList())
    .withMessage("Invalid Faculty of Graduation"),
  // Year of Graduation
  check("yearOfGraduation")
    .notEmpty()
    .trim()
    .withMessage("Year of Graduation must be provided")
    .isNumeric()
    .withMessage("Year of Graduation must be a number")
    .isLength(4)
    .withMessage("Year of Graduation must be 4 digits")
    .matches(/^202[0-5]$/)
    .withMessage("Please add a year between 2020 and 2025"),

  // Faculty ID Number
  check("facultyIDNumber")
    .notEmpty()
    .trim()
    .withMessage("Faculty ID Number must be provided")
    .isNumeric()
    .withMessage("Faculty ID Number must be a number")
    .isLength({ min: 1, max: 3 })
    .withMessage("Faculty ID Number must be valid"),

  // Order Of Graduate
  check("orderOfGraduate")
    .notEmpty()
    .trim()
    .withMessage("Order Of Graduate must be provided")
    .isNumeric()
    .withMessage("Order Of Graduate must be a number")
    .isLength({ min: 1, max: 3 })
    .withMessage("Order Of Graduate must be valid"),

  // Grade
  check("grade")
    .notEmpty()
    .trim()
    .withMessage("Grade must be provided")
    .isIn(grades)
    .withMessage("Invalid Grade"),
  // Hospital
  check("hospital")
    .notEmpty()
    .trim()
    .withMessage("Hospital must be provided")
    .isIn(["al_hussein", "sayed_galal"])
    .withMessage("This hospital is not listed"),
  // Email
  check("email")
    .notEmpty()
    .trim()
    .withMessage("Email must be provided")
    .isEmail()
    .withMessage("Email value is not valid")
    .toLowerCase()
    .custom(async (input) => {
      await checkExistingUser({ email: input }, "Email already in use");
    }),
  // Phone
  check("phone")
    .notEmpty()
    .trim()
    .withMessage("Phone must be provided")
    .matches(/^(?:\+20)?01[0-2,5]\d{8}$/)
    .withMessage("Invalid Egyptian mobile number (e.g., 0101234567)")
    .customSanitizer((input) => {
      return input.startsWith("+20") ? input : `+20${input}`;
    })
    .custom(async (input) => {
      await checkExistingUser({ phone: input }, "Phone already in use");
    }),
  // Password
  check("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain uppercase and lowercase letters.")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character."),
];
