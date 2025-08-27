"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishSignupSchema = exports.resetPasswordSchema = exports.updateUserSchema = exports.loginSchema = exports.createAccountSchema = void 0;
const yup = __importStar(require("yup"));
exports.createAccountSchema = yup.object({
    email: yup
        .string()
        .email("Invalid email format")
        .required("Email is required"),
    password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
    dateOfBirth: yup
        .date()
        .max(new Date(), "Date of birth cannot be in the future")
        .required("Date of birth is required"),
    fullName: yup
        .string()
        .min(3, "Full name must be at least 3 characters")
        .required("Full name is required"),
    howdidyouhearaboutus: yup.string().nullable(), // optional
    phoneNumber: yup
        .string()
        .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
        .required("Phone number is required"),
});
exports.loginSchema = yup.object({
    email: yup
        .string()
        .email("Invalid email format")
        .required("Email is required"),
    password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required("Password is required"),
});
exports.updateUserSchema = yup.object({
    email: yup
        .string()
        .email("Invalid email format")
        .required("Email is required"),
    dateOfBirth: yup
        .date()
        .max(new Date(), "Date of birth cannot be in the future")
        .required("Date of birth is required")
        .optional(),
    fullname: yup
        .string()
        .min(3, "Full name must be at least 3 characters")
        .required("Full name is required")
        .optional(),
    howdidyouhearaboutus: yup.string().nullable(), // optional
    phoneNumber: yup
        .string()
        .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
        .required("Phone number is required")
        .optional(),
    profilePicture: yup.string().url("Invalid image URL").optional(),
});
exports.resetPasswordSchema = yup.object({
    email: yup
        .string()
        .email("Invalid email format")
        .required("Email is required"),
    password: yup
        .string()
        .min(8, "Password must be at least 8 characters")
        .required("New password is required"),
});
exports.finishSignupSchema = yup.object({
    dateOfBirth: yup
        .date()
        .max(new Date(), "Date of birth cannot be in the future")
        .required("Date of birth is required"),
    username: yup
        .string()
        .min(3, "Username must be at least 3 characters")
        .required("Username is required"),
    howdidyouhearaboutus: yup.string().nullable(), // optional
    phoneNumber: yup
        .string()
        .matches(/^\+?[0-9]{7,15}$/, "Invalid phone number")
        .required("Phone number is required"),
});
