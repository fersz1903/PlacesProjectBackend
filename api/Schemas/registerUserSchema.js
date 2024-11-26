const Joi = require("joi");

const registerUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Geçerli bir e-posta adresi giriniz.",
    "any.required": "E-posta alanı zorunludur.",
  }),
  firstname: Joi.string().min(2).max(20).required().messages({
    "string.min": "İsim en az {#limit} karakter olmalıdır.",
    "string.max": "İsim en fazla {#limit} karakter olmalıdır.",
    "any.required": "İsim alanı zorunludur.",
  }),
  lastname: Joi.string().min(2).max(20).required().messages({
    "string.min": "Soyisim en az {#limit} karakter olmalıdır.",
    "string.max": "Soyisim en fazla {#limit} karakter olmalıdır.",
    "any.required": "Soyisim alanı zorunludur.",
  }),
  password: Joi.string()
    .min(8) // En az 8 karakter uzunluğunda olmalı
    .messages({
      "string.min": "Şifre en az {#limit} karakter uzunluğunda olmalıdır.",
      "string.pattern.base":
        "Şifre en az bir büyük harf ve bir küçük harf içermelidir.",
    })
    .pattern(new RegExp("(?=.*[A-Z])")) // En az bir büyük harf içermeli
    .pattern(new RegExp("(?=.*[a-z])")) // En az bir küçük harf içermeli
    .pattern(new RegExp("(?=.*\\d)")) // En az bir rakam içermeli
    .rule({ message: "Şifre en az bir rakam içermelidir." })
    .required(),
});

module.exports = { registerUserSchema };
